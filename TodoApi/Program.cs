using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TodoApi;
using Microsoft.OpenApi;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);
// סודות (מפתח JWT וסיסמת מסד הנתונים) יושבים בקובץ מקומי שלא עולה לגיט, או במשתני סביבה בשרת
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

builder.Services.AddDbContext<ToDoDbContext>(options =>
    options.UseMySql(builder.Configuration.GetConnectionString("ToDoDB"),
        ServerVersion.Parse("8.0.46-mysql")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "הדביקי כאן את הטוקן שקיבלת מ-login"
    });
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();
app.UseCors("AllowAll");

app.UseSwagger();
app.UseSwaggerUI();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Hello World!");
// כל משתמש רואה ומשנה רק את המשימות שלו - ה-id נלקח מהטוקן
app.MapGet("/api/items", async (ToDoDbContext db, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    return await db.Items.Where(i => i.UserId == userId).ToListAsync();
}).RequireAuthorization();

app.MapPost("/api/items", async (ToDoDbContext db, Item item, ClaimsPrincipal user) =>
{
    item.UserId = GetUserId(user);//לא סומכים על מה שהלקוח שולח
    db.Items.Add(item);
    await db.SaveChangesAsync();
    return Results.Created($"/api/items/{item.Id}", item);
}).RequireAuthorization();

app.MapPut("/api/items/{id}", async (ToDoDbContext db, int id, Item updatedItem, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    var item = await db.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    if (item is null) return Results.NotFound();
    if (updatedItem.IsComplete.HasValue)//לא דורסים את הסימון אם הלקוח לא שלח אותו
        item.IsComplete = updatedItem.IsComplete;
    if (!string.IsNullOrEmpty(updatedItem.Name))
        item.Name = updatedItem.Name;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.MapDelete("/api/items/{id}", async (ToDoDbContext db, int id, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    var item = await db.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    if (item is null) return Results.NotFound();
    db.Items.Remove(item);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.MapPost("/api/register", async (ToDoDbContext db, UserDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.UserName) || string.IsNullOrWhiteSpace(dto.Password))
        return Results.BadRequest("Username and password are required");
    var userName = dto.UserName.Trim();
    var exists = await db.Users.AnyAsync(user => user.UserName == userName);
    if(exists)
        return Results.Conflict("Username already exists");
    var user=new User
    {
        UserName=userName,
        Password=BCrypt.Net.BCrypt.HashPassword(dto.Password)
    };
    db.Users.Add(user);
    try
    {
        await db.SaveChangesAsync();
    }
    catch (DbUpdateException)
    {
        // בקשות במקביל עוברות את הבדיקה למעלה; האינדקס UNIQUE במסד הוא זה שחוסם בפועל
        return Results.Conflict("Username already exists");
    }
    return Results.Ok(new{user.Id, user.UserName });
});

app.MapPost("/api/login", async (ToDoDbContext db, UserDto dto, IConfiguration config) =>
{
    if (string.IsNullOrWhiteSpace(dto.UserName) || string.IsNullOrWhiteSpace(dto.Password))
        return Results.BadRequest("Username and password are required");

    var loginName = dto.UserName.Trim();
    var user = await db.Users.FirstOrDefaultAsync(u => u.UserName == loginName);
    if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
        return Results.Unauthorized();

    var claims = new[]
    {
        new Claim("id", user.Id.ToString()),
        new Claim("name", user.UserName!)
    };

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: config["Jwt:Issuer"],
        audience: config["Jwt:Audience"],
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(double.Parse(config["Jwt:ExpiresInMinutes"]!)),
        signingCredentials: creds);

    var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
    return Results.Ok(new { token = tokenString });
});

app.Run();

static int GetUserId(ClaimsPrincipal user) => int.Parse(user.FindFirst("id")!.Value);

public record UserDto(string UserName, string Password);
