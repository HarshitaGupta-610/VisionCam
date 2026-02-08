import axios from "axios";

export async function callEmergencyAPI(token:string){
  await axios.post(
    "http://localhost:3001/api/v1/emergency",
    {},
    {
      headers:{
        Authorization:`Bearer ${token}`
      }
    }
  );
}
