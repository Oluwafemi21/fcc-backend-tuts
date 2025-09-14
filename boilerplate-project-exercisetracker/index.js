require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, });


app.use(cors())
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// create user schema
const userSchema = new mongoose.Schema({
  username: String
}, {
  toJSON: {
    transform: function (doc, ret) {
      // 'ret' is the plain object that will be sent back.
      // We can delete the properties we don't want.
      delete ret.__v;
    }
  }
});


let User = mongoose.model('User', userSchema);

// create log schema
const logSchema = new mongoose.Schema({
  user: mongoose.Types.ObjectId,
  description: String,
  duration: Number,
  date: Date
}, {
  toJSON: {
    transform: function (doc, ret) {
      // 'ret' is the plain object that will be sent back.
      // We can delete the properties we don't want.
      delete ret.__v;
    }
  }
}
)

let Log = mongoose.model('Log', logSchema);

// controllers
const createUser = (req, res) => {
    let username = req.body.username

    if (username.length < 2) {
        res.status(400).json({
            message: "Username not valid"
        })
    }
    let person = new User({
        username
    })

    person.save((err, data) => {
        if (err) {
            return res.status(400).json({
                message: err
            })
        }

        if (data) {
            return res.status(201).json({
              data
            })
        }
    })
}

const getAllUsers = async (req, res) => {
  try {
    let response = await User.find({});
    return res.status(200).json(response)
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const returnDateFormat = (date) => {
  if(!date)  return new Date()
  return new Date(date)
}

const formatDate = (date) => {
  return new Date(date).toDateString()
}

const createExercise = async (req, res) => {
  let userId = req.params._id
  let exerciseObject = {
    description: req.body.description,
    duration: req.body.duration,
    date: returnDateFormat(req.body.date)
  }

  // find the user with the id
  let userData = await User.findById(userId)

  if (!userData) {
    return res.status(400).json({
      error: "User does not exist"
    })
  }

  // save the log in the logs
  let newEntry = new Log({
    ...exerciseObject,
    user:userData._id
  })

  newEntry.save((err, data) => {
        if (err) {
            return res.status(400).json({
                message: err
            })
        }

        if (data) {
            return res.status(201).json({
              username: userData.username,
              _id: userData._id,
              ...exerciseObject,
              date: formatDate(exerciseObject.date),
            })
        }
    })
}

const addDay = (date, day) => {
  let newDate = new Date(date)
  newDate.setDate(newDate.getDate() + day)
  return newDate;
}

const getUserLogs = async (req, res) => {
  const { from, to, limit } = req.query;

  let itemsPerPage = parseInt(limit)

  let userId = req.params._id;
  
  let dateMatchingPipeline = null
  if (from || to) dateMatchingPipeline = {}
  if (from) dateMatchingPipeline.$gte = new Date(from)
  if (to) dateMatchingPipeline.$lt = addDay(to, 1)
  

  // find the log with the userId and return all of the logs
  let pipelineArray = [];
  if (dateMatchingPipeline) {
    pipelineArray.push({
      $match: {
        date: dateMatchingPipeline
      }
    })
  }

  if (itemsPerPage && itemsPerPage > 0) {
    pipelineArray.push({
      $limit: itemsPerPage
    })
  }

  

  let userLogs = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "logs",
        localField: "user",
        foreignField: "userId",
        as: "logs",
        pipeline: [...pipelineArray,
          {
          $project: {
            __v: 0,
              user: 0,
              _id: 0,
          },
        },
        ]
      },
    },
    {
      $project: {
        __v: 0, // Exclude the __v field from the top-level user document
      }
    },
  ])

  const responseData = userLogs[0].logs.map((log) => {
    return {
      ...log,
      date: formatDate(log.date)
    }
  })

  return res.status(200).json({
    ...userLogs[0],
    logs: responseData
  })
}


app.post("/api/user", createUser);
app.get("/api/users", getAllUsers);
app.post("/api/users/:_id/exercises", createExercise);
app.get("/api/users/:_id/logs", getUserLogs)

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
