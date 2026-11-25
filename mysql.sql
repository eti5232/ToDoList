CREATE DATABASE IF NOT EXISTS ToDoDB;
USE ToDoDB;

-- users קודם, כי items מצביעה עליה
CREATE TABLE IF NOT EXISTS users(
    Id INT NOT NULL AUTO_INCREMENT,
    UserName VARCHAR(50),
    Password VARCHAR(255) NOT NULL, -- hash של BCrypt באורך 60 תווים
    PRIMARY KEY (Id),
    CONSTRAINT UQ_users_UserName UNIQUE (UserName) -- חוסם שמות כפולים גם בבקשות במקביל
);

CREATE TABLE IF NOT EXISTS items (
  Id INT NOT NULL AUTO_INCREMENT,
  Name VARCHAR(100),
  IsComplete TINYINT(1),
  UserId INT NULL,
  PRIMARY KEY (Id),
  CONSTRAINT FK_items_users FOREIGN KEY (UserId) REFERENCES users(Id) ON DELETE CASCADE
);

-- עדכון מסד נתונים קיים (להריץ פעם אחת):
-- ALTER TABLE ToDoDB.users MODIFY Password VARCHAR(255) NOT NULL;
-- ALTER TABLE ToDoDB.items ADD COLUMN UserId INT NULL;
-- ALTER TABLE ToDoDB.items ADD CONSTRAINT FK_items_users FOREIGN KEY (UserId) REFERENCES ToDoDB.users(Id) ON DELETE CASCADE;
-- משימות ישנות בלי משתמש: לשייך (UPDATE ToDoDB.items SET UserId = 1 WHERE UserId IS NULL;) או למחוק
-- ALTER TABLE ToDoDB.users ADD CONSTRAINT UQ_users_UserName UNIQUE (UserName); -- קודם למחוק שמות כפולים
-- SHOW COLUMNS FROM ToDoDB.items;
