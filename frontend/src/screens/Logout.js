import { useEffect } from "react";
import { removeToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();
  useEffect(() => {
    removeToken();
    navigate("/login");
  }, [navigate]);
  return null;
};

export default Logout; 