import express from 'express';

import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/projectgpt')
.then(() => console.log('Database connected successfully'))
.catch(err => console.error('Database connection error: ', err));


const app = express();
app.use(express.json());
const port = 3000;

// Models
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});

UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', UserSchema);

const TaskSchema = new mongoose.Schema({
  name: String,
  title: String,
  description: String,
  dueDate: Date,
  status: String
});


const Task = mongoose.model('Task', TaskSchema);

// Auth End Points

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const user = new User({ username, password });
  await user.save();
  const token = jwt.sign({ _id: user._id }, 'SECRET_KEY');
  res.send({ token });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).send('Invalid username or password');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).send('Invalid username or password');
  }
  const token = jwt.sign({ _id: user._id }, 'SECRET_KEY');
  res.send({ token });
});

// Task End Points
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

// auth middleware

const auth = async (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  const data = jwt.verify(token, 'SECRET_KEY');
  try {
    const user = await User.findOne({ _id: data._id });
    if (!user) {
      throw new Error();
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Not authorized to access this resource' });
  }
};

// Middleware for error handling


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});