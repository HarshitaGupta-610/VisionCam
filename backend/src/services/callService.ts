import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function callEmergencyAPI(token:string){
  await axios.post(
    `${BACKEND_URL}/api/v1/emergency`,
    {},
    {
      headers:{
        Authorization:`Bearer ${token}`
      }
    }
  );
}
