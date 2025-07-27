export const setToken = (token) => {
  console.log("Token just set:", getToken());
  localStorage.setItem('token', token);
  console.log("Token just set:", getToken());
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const removeToken = () => {
  localStorage.removeItem('token');
}; 