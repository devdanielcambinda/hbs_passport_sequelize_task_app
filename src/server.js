const app = require("./app");
const port = process.env.PORT || 3000 ;
const sequelize = require('./database/db')
const User = require('./models/user')
const Task = require("./models/task");

User.hasMany(Task);
Task.belongsTo(User);

app.listen(port,async () => {
  console.log(`Server is up on port ${port}`);
  try{
        await sequelize.sync(
            //{force: true}
        )
        console.log('Connected to database')
    }catch(error){
        console.error(`Error: Cannot connect to database ${error}`)
    }
});
