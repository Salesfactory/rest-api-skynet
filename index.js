require("dotenv").config();
const makeApp = require("./src/app");
const app = makeApp();
const port = process.env.PORT || 5000;

app.listen(port, (err) => {
  console.log(`Server is running on port ${port}`);
});