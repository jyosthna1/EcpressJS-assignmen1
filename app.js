const express = require("express");
const app = express();
const path = require("path");
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const formatISO = require("date-fns/formatISO");
const isValid = require("date-fns/isValid");
const format = require("date-fns/format");
const getYear = require("date-fns/getYear");
const getMonth = require("date-fns/getMonth");
const getDate = require("date-fns/getDate");
const dbPath = path.join(__dirname, "todoApplication.db");

let database = null;

const initializeDatabase = async () => {
  try {
    database = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDatabase();

const convertDataObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const hasPriorityValue = (request) => {
  return request.priority !== undefined;
};

const hasStatusValue = (request) => {
  return request.status !== undefined;
};

const hasPriorityAndStatusValue = (request) => {
  return request.status !== undefined && request.priority !== undefined;
};
const hasCategoryAndStatusValue = (request) => {
  return request.category !== undefined && request.status !== undefined;
};

const hasCategoryValue = (request) => {
  return request.category !== undefined;
};
const hasPriorityAndCategoryValue = (request) => {
  return request.priority !== undefined && request.category !== undefined;
};

const hasTodoValue = (request) => {
  return request.todo !== undefined;
};

//API 1
app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "", category } = request.query;

  let dbQuery = "";
  let data = null;
  switch (true) {
    case hasPriorityValue(request.query):
      if (
        (priority === "HIGH") ^
        (priority === "LOW") ^
        (priority === "MEDIUM")
      ) {
        dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}';`;
        data = await database.all(dbQuery);
        response.send(data.map((eachItem) => convertDataObject(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case hasStatusValue(request.query):
      if (
        (status === "TO DO") ^
        (status === "IN PROGRESS") ^
        (status === "DONE")
      ) {
        dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status='${status}';`;
        data = await database.all(dbQuery);
        response.send(data.map((eachItem) => convertDataObject(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriorityAndStatusValue(request.query):
      dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}' AND status='${status}';`;
      data = await database.all(dbQuery);
      response.send(data.map((eachItem) => convertDataObject(eachItem)));
      break;
    case hasCategoryAndStatusValue(request.query):
      dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}' AND status='${status}';`;
      data = await database.all(dbQuery);
      response.send(data.map((eachItem) => convertDataObject(eachItem)));
      break;
    case hasPriorityAndCategoryValue(request.query):
      dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}' AND category='${category}';`;
      data = await database.all(dbQuery);
      response.send(data.map((eachItem) => convertDataObject(eachItem)));
      break;
    case hasCategoryValue(request.query):
      if (
        (category === "WORK") ^
        (category === "HOME") ^
        (category === "LEARNING")
      ) {
        dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}';`;
        data = await database.all(dbQuery);
        response.send(data.map((eachItem) => convertDataObject(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    default:
      dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await database.all(dbQuery);
      response.send(data.map((eachItem) => convertDataObject(eachItem)));
  }
});

//API2
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const todoIdQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const todoResponse = await database.get(todoIdQuery);
  response.send(convertDataObject(todoResponse));
});

//API3
app.get("/agenda", async (request, response) => {
  const { date } = request.query;
  const valid = isValid(new Date(date));

  const formatDate = formatISO(new Date(date));
  const formatInto = format(new Date(formatDate), "yyyy-MM-dd");

  const year = getYear(new Date(formatInto));
  const month = getMonth(new Date(formatInto)) + 1;
  const dateGiven = getDate(new Date(formatInto));
  if (valid === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const dateQuery = `SELECT * FROM todo WHERE 
  strftime('%Y',due_date)='${year}' AND strftime('%m',due_date)='${month}' AND strftime('%d',due_date)='${dateGiven}';`;
    const dateQueryResponse = await database.all(dateQuery);
    response.send(
      dateQueryResponse.map((eacDate) => convertDataObject(eacDate))
    );
  }
});

//API4 POST

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const requestBody = request.body;
  const valid = isValid(new Date(dueDate));
  console.log(valid);

  if (
    (requestBody.category !== "WORK") ^
    (requestBody.category !== "HOME") ^
    (requestBody.category !== "LEARNING")
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (
    (status !== "TO DO") ^
    (status !== "IN PROGRESS") ^
    (status !== "DONE")
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    (priority !== "HIGH") ^
    (priority !== "LOW") ^
    (priority !== "MEDIUM")
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (valid === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const postData = `INSERT INTO todo (id,todo,priority,status,category,due_date) 
    VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
    await database.run(postData);
    response.send("Todo Successfully Added");
  }
});
//API6
app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;

  const valid = isValid(new Date(requestBody.dueDate));
  let updateColumn = "";
  const todoIdQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const todoIdQueryResponse = await database.get(todoIdQuery);
  const {
    status = todoIdQueryResponse.status,
    priority = todoIdQueryResponse.priority,
    category = todoIdQueryResponse.category,
    dueDate = todoIdQueryResponse.dueDate,
    todo = todoIdQueryResponse.todo,
  } = request.body;
  let updateQuery = "";
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      if (
        (requestBody.status !== "TO DO") ^
        (requestBody.status !== "IN PROGRESS") ^
        (requestBody.status !== "DONE")
      ) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        updateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}' WHERE id=${todoId};`;
        await database.run(updateQuery);
        response.send(`${updateColumn} Updated`);
      }
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      if (
        (requestBody.priority !== "HIGH") ^
        (requestBody.priority !== "LOW") ^
        (requestBody.priority !== "MEDIUM")
      ) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        updateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}' WHERE id=${todoId};`;
        await database.run(updateQuery);
        response.send(`${updateColumn} Updated`);
      }
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      updateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}' WHERE id=${todoId};`;
      await database.run(updateQuery);
      response.send(`${updateColumn} Updated`);
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      if (
        (requestBody.category !== "WORK") ^
        (requestBody.category !== "HOME") ^
        (requestBody.category !== "LEARNING")
      ) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        updateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}' WHERE id=${todoId};`;
        await database.run(updateQuery);
        response.send(`${updateColumn} Updated`);
      }
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      if (valid === false) {
        response.status(400);
        response.send("Invalid Due Date");
      } else {
        updateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}' WHERE id=${todoId};`;
        await database.run(updateQuery);
        response.send(`${updateColumn} Updated`);
      }

      break;
  }
});

//API6 DELETE todo

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await database.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
