import app from './app';
import { port, URL } from "./config";

try {
    app.listen(port, () => {
      console.log(`Digital healthcare is running on ${URL}:${port}`);
    });
  } catch (error: any) {
    console.log(`Error occurred: ${error.message}`);
  }

  
  
