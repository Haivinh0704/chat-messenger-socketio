### REQUIRED socket io Front-End :

add to option socketio front-end

- transports : ['websocket'];
- URL : domain backend;
- auth : token user login

```bash
Eample :
const URL = "http://localhost:4000";
export const socket = io(URL, {
  transports: ["websocket"],
  autoConnect: false,
  auth: { token: `Bearer ${localStorage.getItem("token")}` }
});
```
