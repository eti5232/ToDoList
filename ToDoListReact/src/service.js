import axios from 'axios';

axios.defaults.baseURL = process.env.REACT_APP_API_URL
const savedToken = localStorage.getItem("token");
if (savedToken) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
}

function saveToken(token) {
  localStorage.setItem("token", token);
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}
axios.interceptors.response.use(
  response => response,
  error => {
    console.error("API error:", error);
    if (error.response && error.response.status === 401 &&
      !error.config.url.includes("/login")) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default {
  getTasks: async () => {
    const result = await axios.get(`/items`)
    return result.data;
  },

  addTask: async (name) => {
    console.log('addTask', name)
    const result = await axios.post(`/items`, { name: name, isComplete: false })
    return result.data;
  },

  setCompleted: async (id, isComplete) => {
    await axios.put(`/items/${id}`, { isComplete: isComplete });
    return {};
  },

  deleteTask: async (id) => {
    await axios.delete(`/items/${id}`)
    console.log('deleteTask')
  },

  register: async (userName, password) => {
    await axios.post("/register", { userName, password });
  },

  login: async (userName, password) => {
    const res = await axios.post("/login", { userName, password });
    saveToken(res.data.token);
  },

  logout: () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
  },
};
