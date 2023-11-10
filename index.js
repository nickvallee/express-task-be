import express from 'express';

import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/projectgpt')
.then(() => console.log('Database connected successfully'))
.catch(err => console.error('Database connection error: ', err));


const app = express();
app.use(express.json());
const port = 3000;

// Models
const TaskSchema = new mongoose.Schema({
  name: String,
  title: String,
  description: String,
  dueDate: Date,
  status: String
});

const Task = mongoose.model('Task', TaskSchema);

app.get('/tasks', (req, res) => {
  Task.find().then(tasks => res.send(tasks));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

app.post('/tasks', (req, res) => {

  const task = new Task(req.body);
  task.save()
    .then(() => res.status(201).send(task))
    .catch(err => res.status(400).send(err));
});

app.get('/tasks/:id', (req, res) => {
  Task.findById(req.params.id)
    .then(task => {
      if (!task) {
        return res.status(404).send();
      }
      res.send(task);
    })
    .catch(err => res.status(400).send(err));
});

app.put('/tasks/:id', (req, res) => {
  Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .then(task => {
      if (!task) {
        return res.status(404).send();
      }
      res.send(task);
    })
    .catch(err => res.status(400).send(err));
});

app.delete('/tasks/:id', (req, res) => {
  Task.findByIdAndDelete(req.params.id)
    .then(task => {
      if (!task) {
        return res.status(404).send();
      }
      res.send(task);
    })
    .catch(err => res.status(400).send(err));
});