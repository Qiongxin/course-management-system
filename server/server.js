const express = require("express");
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();
const port = 3001;
const { v4: uuid } = require("uuid");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
require("dotenv").config();
const mongoose = require("mongoose");

const JWT_SECRET = 'your-super-secret-key-change-in-production';

const Course = require("./models/Course");
const User = require("./models/User");
const Signup = require("./models/Signup");
const Slot = require("./models/Slot");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected!");
  })
  .catch((err) => {
    console.error(err);
  });

// app.use(express.static(path.join(__dirname, '../client/lab4/build')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '200kb' }));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

app.post('/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.json({
        success: false,
        error: 'User already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      userId: Date.now() + Math.floor(Math.random() * 100),
      firstName,
      lastName,
      email,
      hashedPassword,
      role,
      firstLogin: true
    });

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success:false,
      error:error.message
    });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, error: 'Please enter email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.hashedPassword);
    if (!validPassword) {
      return res.json({ success: false, error: 'Invalid password' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        firstLogin: user.firstLogin
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/auth/current', authenticateToken, async (req, res) => {
  const user = await User.findOne({
    userId: req.user.userId
  });
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  res.json({
    success: true,
    user: {
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      firstLogin: user.firstLogin
    }
  });
});

app.post('/auth/change-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Email and new password are required"
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.hashedPassword = hashedPassword;
    user.firstLogin = false;

    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update password"
    });
  }
});

app.post('/auth/update-password', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, error: "User not found" });
    }

    const match = await bcrypt.compare(
      oldPassword,
      user.hashedPassword
    );
    if (!match) {
      return res.json({ success: false, error: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.hashedPassword = hashedPassword;

    await user.save();
    return res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false, error: "Update failed" });
  }
});

app.get('/getUsers', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().lean();
    const safeUsers = users.map(({ hashedPassword, ...rest }) => rest);
    res.json({
      success: true,
      users: safeUsers
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to get users"
    });
  }
});

app.post('/addTA', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found'
      });
    }
    user.role = "ta";

    await user.save();
    res.json({
      success: true
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to add TA"
    });
  }
});

app.post('/removeTA', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found'
      });
    }
    user.role = "student";
    await user.save();
    res.json({ success: true });
  }
  catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to remove TA"
    });
  }
});

app.post('/resetUserPassword', authenticateToken, async (req, res) => {
  const { userId } = req.body;
  const user = await User.findOne({ userId });
  if (!user) {
    return res.status(400).json({ success: false, error: 'User not found' });
  }

  const tempPassword = "password";
  user.hashedPassword = await bcrypt.hash(tempPassword, 10);
  user.firstLogin = true;
  await user.save();
  res.json({ success: true, newPassword: tempPassword });
});

app.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find();

    res.send(courses);

  } catch (error) {
    res.status(500).send({
      message: error.message
    });
  }
});

// Authentication required routes
app.post('/members', authenticateToken, async (req, res) => {
  try {
    const { termCode, section, role } = req.body;
    const members = [];
    const courses = await Course.find({
      termCode,
      ...(section && { section })
    });

    for (const course of courses) {
      const users = await User.find({
        userId: {
          $in: course.member
        }
      });

      for (const user of users) {
        if (!role || user.role.toLowerCase() === role.toLowerCase()) {
          members.push({
            termCode: course.termCode,
            section: course.section,
            userId: user.userId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          });
        }
      }
    }
    res.json(members);
  } catch(error) {
    console.log(error);

    res.status(500).json({
      success:false,
      error:"Failed to get members"
    });
  }
});

app.post('/addCourse', authenticateToken, async (req, res) => {
  try {
    const { termCode, courseName, section } = req.body;

    const existingCourse = await Course.findOne({
      termCode,
      section
    });

    if (existingCourse) {
      return res.status(400).json({
        success: false,
        error: 'Fail to submit, the course already exists'
      });
    }

    const newCourse = await Course.create({
      courseId: uuid(),
      termCode,
      courseName,
      section,
      member: []
    });

    res.json({
      success: true,
      course: newCourse
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


app.patch("/courses/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { termCode, section, courseName } = req.body;

    const course = await Course.findOne({ courseId });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    const signup = await Signup.findOne({
      termCode: course.termCode,
      section: course.section
    });

    if (signup) {
      course.courseName = courseName;
      await course.save();
      return res.json({ success: true, message: "Updated course name only", course });
    }
    const conflict = await Course.findOne({
      courseId: {
        $ne: courseId
      },
      termCode,
      section
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        error: "A course with this term code and section already exists",
      });
    }

    course.termCode = termCode;
    course.section = section;
    course.courseName = courseName;
    await course.save();
    res.json({
      success: true,
      course
    });
  }
  catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


app.delete("/deleteCourse/:courseId", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findOne({
      courseId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found"
      });
    }

    const hasSignup = await Signup.findOne({
      termCode: course.termCode,
      section: course.section
    });
    if (hasSignup) {
      return res.status(400).json({ 
        success: false, 
        error: "Cannot delete course with existing signup sheets" 
      });
    }
    await Course.deleteOne({
      courseId
    });
    res.json({
      success: true
    });
  }
  catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
})

app.post('/addMember', authenticateToken, async (req, res) => {
  try {
    const { termCode, section, members } = req.body;
    const course = await Course.findOne({
      termCode,
      section
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found"
      });
    }
    const ignored = [];
    const newMemberIds = [];
    for (const m of members) {
      const existingUser = await User.findOne({
        email: m.email
      });
      if (existingUser) {
        if (course.member.includes(existingUser.userId)) {
          ignored.push(m.email);
          continue;
        }
        course.member.push(existingUser.userId);
        newMemberIds.push(existingUser.userId);
        continue;
      }
      const hashedPassword = await bcrypt.hash(
        m.password,
        10
      );

      const newUser = await User.create({
        userId: Date.now() + Math.floor(Math.random() * 100),
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        hashedPassword,
        role: "student",
        firstLogin: true
      });
      course.member.push(newUser.userId);
      newMemberIds.push(newUser.userId);
    }
    await course.save();
    res.json({
      success: true,
      addedCount: newMemberIds.length,
      ignored
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success:false,
      error:"Failed to add members"
    });
  }
});

app.delete("/deleteMember", authenticateToken, async (req, res) => {
  try {
    const { termCode, section, userId } = req.body;
    const course = await Course.findOne({
      termCode,
      section
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found"
      });
    }

    const index = course.member.indexOf(userId);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: "Member not found"
      });
    }

    course.member.splice(index, 1);
    await course.save();
    res.json({
      success: true
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to delete member"
    });

  }
});

app.post("/addMemberCSV", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    const { termCode, section } = req.body;
    const csvFile = req.file.path;
    const course = await Course.findOne({
      termCode,
      section
    });
    if (!course) {
      fs.unlinkSync(csvFile);
      return res.status(404).json({
        success:false,
        error:"Course not found"
      });
    }
    const lines = fs
      .readFileSync(csvFile, "utf-8")
      .split("\n");

    const existingUserIds = new Set(
      course.member.map(id => id.toString())
    );

    const added = [];
    const ignored = [];

    const clean = str =>
      str.trim().replace(/^"|"$/g, "");
    for (const line of lines) {
      if (!line.trim()) continue;
      const [
        lastNameRaw,
        firstNameRaw,
        emailRaw,
        passwordRaw
      ] = line.split(",");
      const lastName = clean(lastNameRaw);
      const firstName = clean(firstNameRaw);
      const email = clean(emailRaw);
      const password = clean(passwordRaw);

      const existingUser = await User.findOne({
        email
      });
      if (existingUser) {
        if (existingUserIds.has(existingUser.userId.toString())) {
          ignored.push(email);
        } else {
          course.member.push(existingUser.userId);
          existingUserIds.add(
            existingUser.userId.toString()
          );
          added.push(email);
        }
        continue;
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId =
        Date.now() + Math.floor(Math.random() * 100);
      const newUser = await User.create({
        userId,
        firstName,
        lastName,
        email,
        hashedPassword,
        role:"student",
        firstLogin:true
      });
      course.member.push(newUser.userId);
      existingUserIds.add(
        newUser.userId.toString()
      );
      added.push(email);
    }
    await course.save();
    fs.unlinkSync(csvFile);
    res.json({
      success:true,
      addedCount:added.length,
      ignored
    });
  } catch(error) {
    console.log(error);
    res.status(500).json({
      success:false,
      error:"Failed to import members"
    });
  }
});

app.post('/signupSheet', authenticateToken, async (req, res) => {
  try {
    const { termCode, section } = req.body;
    const query = {};
    if (termCode) {
      query.termCode = termCode;
    }
    if (section) {
      query.section = section;
    }
    const signup = await Signup.find(query);
    res.send(signup);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to get signup sheets"
    });
  }
});

app.post('/addSignup', authenticateToken, async (req, res) => {
  try {
    const {
      termCode,
      section,
      courseName,
      assignmentName,
      notBefore,
      notAfter,
      signupID
    } = req.body;
    const exists = await Signup.findOne({
      termCode,
      section,
      assignmentName
    });
    if (exists) {
      return res.status(400).json({
        success: false,
        error: 'Fail to submit, the assignment already got a signup sheet for this course'
      });
    }
    const signup = new Signup({
      termCode,
      section,
      courseName,
      assignmentName,
      notBefore,
      notAfter,
      signupID
    });
    await signup.save();
    res.json({
      success: true
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: 'Failed to add signup sheet'
    });
  }
});

app.delete("/deleteSignup/:signupID", authenticateToken, async (req, res) => {
  try {
    const { signupID } = req.params;
    const signupSheet = await Signup.findOne({
      signupID
    });
    if (!signupSheet) {
      return res.status(404).json({
        success: false,
        error: "Signup sheet not found"
      });
    }
    const slotsWithSignup = await Slot.find({
      signupID
    });
    const hasSignups = slotsWithSignup.some(
      slot => slot.members && slot.members.length > 0
    );
    if (hasSignups) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete signup sheet: there are slots with sign-ups"
      });
    }
    await Signup.deleteOne({
      signupID
    });
    res.json({
      success: true
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to delete signup sheet"
    });
  }
});

app.post('/addSlots', authenticateToken, async (req, res) => {
  try {
    const {
      signupID,
      start,
      slotDuration,
      numSlots,
      maxMembers
    } = req.body;

    const existingSlots = await Slot.find({
      signupID
    });
    const newSlots = [];
    for (let i = 0; i < numSlots; i++) {
      const newStart = start + i * slotDuration * 60 * 1000;
      const newEnd = newStart + slotDuration * 60 * 1000;
      const overlap = existingSlots.some(slot => {
        const slotStart = slot.start;
        const slotEnd = slot.start + slot.slotDuration * 60 * 1000;
        return Math.max(slotStart, newStart) <
               Math.min(slotEnd, newEnd);
      });
      if (overlap) {
        return res.status(400).json({
          success: false,
          error: `Slot time overlaps with existing slots. Failed at slot index ${i + 1}.`
        });
      }
      newSlots.push({
        signupID,
        start: newStart,
        slotDuration,
        maxMembers,
        slotID: Math.floor(100000 + Math.random() * 900000),
        members: []
      });
    }
    await Slot.insertMany(newSlots);
    res.json({
      success: true,
      added: newSlots.length
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to add slots"
    });
  }
});

app.get("/slots/:signupID", authenticateToken, async (req, res) => {
  try {
    const signupID = Number(req.params.signupID);
    const sheetSlots = await Slot.find({
      signupID
    });
    if (sheetSlots.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No slots found for this signup sheet"
      });
    }
    res.json({
      success: true,
      slots: sheetSlots
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to get slots"
    });
  }
});

app.patch("/slot/:slotID", authenticateToken, async (req, res) => {
  try {
    const slotID = Number(req.params.slotID);
    const { start, slotDuration, maxMembers } = req.body;
    const slot = await Slot.findOne({ slotID });
    if (!slot) {
      return res.status(404).json({
        success: false,
        error: "Slot not found"
      });
    }
    if (
      maxMembers !== undefined &&
      slot.members.length > maxMembers
    ) {
      return res.status(400).json({
        success: false,
        error: `Cannot reduce max members below existing sign-ups (${slot.members.length})`
      });
    }
    if (start !== undefined && slotDuration !== undefined) {
      const newStart = start;
      const newEnd = newStart + slotDuration * 60 * 1000;
      const otherSlots = await Slot.find({
        signupID: slot.signupID,
        slotID: { $ne: slotID }
      });
      const overlap = otherSlots.some(s => {
        const sStart = s.start;
        const sEnd = s.start + s.slotDuration * 60 * 1000;
        return Math.max(sStart, newStart) <
               Math.min(sEnd, newEnd);
      });
      if (overlap) {
        return res.status(400).json({
          success: false,
          error: "New slot time overlaps with other slots"
        });
      }
    }
    if (start !== undefined) {
      slot.start = start;
    }
    if (slotDuration !== undefined) {
      slot.slotDuration = slotDuration;
    }
    if (maxMembers !== undefined) {
      slot.maxMembers = maxMembers;
    }
    await slot.save();
    res.json({
      success: true,
      signedUpMemberIDs: slot.members.map(m => m.userId)
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to update slot"
    });
  }
});

app.delete("/deleteSlot/:slotID", authenticateToken, async (req, res) => {
  try {
    const slotID = Number(req.params.slotID);
    const slot = await Slot.findOne({ slotID });
    if (!slot) {
      return res.status(404).json({
        success: false,
        error: "Slot not found"
      });
    }
    if (slot.members.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete slot: members have already signed up"
      });
    }
    await Slot.deleteOne({ slotID });
    res.json({
      success: true
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to delete slot"
    });
  }
});

app.post("/signup", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {signupID, slotID}=req.body;
    if (!signupID || !slotID || !userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters"
      });
    }
    const slot = await Slot.findOne({
      signupID: Number(signupID),
      slotID: Number(slotID)
    });
    if (!slot) {
      return res.status(404).json({
        success: false,
        error: "Slot not found"
      });
    }
    if (slot.members.length >= slot.maxMembers) {
      return res.status(400).json({
        success: false,
        error: "Slot is full"
      });
    }
    const alreadySignedUp = slot.members.some(
      m => m.userId === Number(userId)
    );
    if (alreadySignedUp) {
      return res.status(400).json({
        success: false,
        error: "Member already signed up"
      });
    }
    slot.members.push({
      userId: Number(userId),
      history: [],
      grade: null,
      bonus: 0,
      penalty: 0,
      comment: "",
      gradedTime: null,
      gradedBy: ""
    });
    await slot.save();
    res.json({
      success: true,
      slot
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to signup"
    });
  }
});

app.delete("/deleteSignup", authenticateToken, async (req, res) => {
  try {
    const { signupID } = req.body;
    const userId = req.user.userId;
    if (!signupID) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters"
      });
    }
    const slot = await Slot.findOne({
      signupID: Number(signupID),
      "members.userId": Number(userId)
    });
    if (!slot) {
      return res.status(404).json({
        success: false,
        error: "Member not signed up in any slot"
      });
    }
    slot.members = slot.members.filter(
      m => m.userId !== Number(userId)
    );
    await slot.save();
    res.json({
      success: true,
      slot
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel signup"
    });
  }
});

app.delete("/deleteSlot/:slotID", authenticateToken, async (req, res) => {
  try {
    const slotID = Number(req.params.slotID);
    const slot = await Slot.findOne({
      slotID
    });
    if (!slot) {
      return res.status(404).json({
        success:false,
        error:"Slot not found"
      });
    }
    if (slot.members.length > 0) {
      return res.status(400).json({
        success:false,
        error:"Cannot delete slot: members have already signed up"
      });
    }
    await slot.deleteOne();
    res.json({
      success:true
    });
  } catch(error){
    console.log(error);
    res.status(500).json({
      success:false,
      error:"Failed to delete slot"
    });
  }
});

app.get("/members/:slotID", authenticateToken, async (req, res) => {
  try {
    const slotID = Number(req.params.slotID);
    if (!slotID) {
      return res.status(400).json({
        success: false,
        error: "Missing slot ID"
      });
    }
    const slot = await Slot.findOne({
      slotID
    });
    if (!slot) {
      return res.status(404).json({
        success: false,
        error: "Slot not found"
      });
    }
    const userIds = slot.members.map(
      m => m.userId
    );
    const users = await User.find({
      userId: {
        $in: userIds
      }
    }).lean();
    const userMap = new Map(
      users.map(user => [
        user.userId,
        user
      ])
    );
    const membersList = slot.members.map(member => {
      const user = userMap.get(
        member.userId
      );
      return {
        userId: member.userId,
        email: user
          ? user.email
          : "",

        firstName: user
          ? user.firstName
          : "",

        lastName: user
          ? user.lastName
          : "",

        grade: member.grade ?? "",
        bonus: member.bonus ?? "",
        penalty: member.penalty ?? "",
        comment: member.comment ?? "",
        gradedBy: member.gradedBy ?? "",
        gradedTime: member.gradedTime ?? null
      };
    });
    res.json({
      success: true,
      members: membersList
    });
  } catch(error) {
    console.log(error);
    res.status(500).json({
      success:false,
      error:"Failed to get members"
    });
  }
});

app.get("/allSlots", authenticateToken, async (req, res) => {
  try {
    const slots = await Slot.find()
      .sort({ start: 1 })
      .lean();
    const userIds = [
      ...new Set(
        slots.flatMap(slot =>
          slot.members.map(m => m.userId)
        )
      )
    ];
    const users = await User.find({
      userId: {
        $in: userIds
      }
    }).lean();
    const userMap = new Map(
      users.map(user => [
        user.userId,
        user
      ])
    );
    const allSlots = slots.map(slot => ({
      ...slot,
      members: slot.members.map(member => {
        const user = userMap.get(member.userId);
        return {
          ...member,

          email: user
            ? user.email
            : "",

          firstName: user
            ? user.firstName
            : "",

          lastName: user
            ? user.lastName
            : ""
        };
      })
    }));
    res.json({
      success: true,
      slots: allSlots
    });
  } catch(error) {
    console.log(error);
    res.status(500).json({
      success:false,
      error:"Failed to get slots"
    });
  }
});

app.post("/grade", authenticateToken, async (req, res) => {
  try {
    const { userId, signupID, grade, bonus = 0, penalty = 0, comment } = req.body;
    const gradedBy = req.user.email;
    if (
      !userId ||
      !signupID ||
      grade == null ||
      grade < 0 ||
      grade > 999 ||
      typeof comment !== "string" ||
      !comment.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid parameters"
      });
    }
    const slot = await Slot.findOne({
      signupID: Number(signupID),
      "members.userId": Number(userId)
    });
    if (!slot) {
      return res.status(404).json({
        success: false,
        error: "Member not found in any slot"
      });
    }
    const member = slot.members.find(
      m => m.userId === Number(userId)
    );
    const now = Date.now();
    if (!member.history) {
      member.history = [];
    }
    const lastComment =
      member.history.length > 0
        ? member.history[member.history.length - 1].comment
        : "";

    if (lastComment.trim() === comment.trim()) {
      return res.status(400).json({
        success: false,
        error: "New comment must be different from the last comment"
      });
    }
    member.grade = grade;
    member.bonus = bonus;
    member.penalty = penalty;
    member.comment = comment;
    member.gradedTime = now;
    member.gradedBy = gradedBy;

    member.history.push({
      grade,
      bonus,
      penalty,
      comment,
      gradedBy,
      gradedTime: now
    });
    await slot.save();
    res.json({
      success: true,
      message:
        member.history.length > 1
          ? "Grade updated"
          : "Grade added",
      updatedMember: member
    });
  } catch(error) {
    console.log(error);
    res.status(500).json({
      success:false,
      error:"Failed to grade member"
    });
  }
});

app.get("/gradeHistory/:signupID/:userId", authenticateToken, async (req, res) => {
  try {
    const { signupID, userId } = req.params;
    const slot = await Slot.findOne({
      signupID: Number(signupID),
      "members.userId": Number(userId)
    });
    if (!slot) {
      return res.status(404).json({
        success: false,
        error: "Member not found"
      });
    }
    const member = slot.members.find(
      m => m.userId === Number(userId)
    );
    res.json({
      success: true,
      history: member.history || []
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to get grade history"
    });
  }
});

app.get("/studentSlots", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const courses = await Course.find({
      member: userId
    });
    if (courses.length === 0) {
      return res.json({
        success: true,
        slots: []
      });
    }
    const signupSheets = await Signup.find({
      $or: courses.map(course => ({
        termCode: course.termCode,
        section: course.section
      }))
    });
    if (signupSheets.length === 0) {
      return res.json({
        success: true,
        slots: []
      });
    }
    const signupIDs = signupSheets.map(sheet => sheet.signupID);
    const slots = await Slot.find({
      signupID: { $in: signupIDs }
    });
    const signupMap = new Map(
      signupSheets.map(sheet => [
        sheet.signupID,
        sheet
      ])
    );
    const result = slots.map(slot => {
      const signup = signupMap.get(slot.signupID);
      return {
        ...slot.toObject(),
        courseName: signup?.courseName ?? "Unknown",
        assignmentName: signup?.assignmentName ?? "Unknown"
      };
    });
    res.json({
      success: true,
      slots: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
});

app.post("/signUpSlot/:slotID", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const slotID = Number(req.params.slotID);
    const now = Date.now();
    const slot = await Slot.findOne({
      slotID
    });
    if (!slot) {
      return res.status(404).json({
        success: false,
        error: "Slot not found"
      });
    }
    if (
      slot.members.some(
        m => m.userId === Number(userId)
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Already signed up"
      });
    }
    if (Number(slot.start) - now < 60 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        error: "Slot must be at least 1 hour ahead"
      });
    }
    if (slot.members.length >= slot.maxMembers) {
      return res.status(400).json({
        success: false,
        error: "Slot is full"
      });
    }
    slot.members.push({
      userId: Number(userId),
      history: [],
      grade: null,
      bonus: 0,
      penalty: 0,
      comment: "",
      gradedTime: null,
      gradedBy: ""
    });
    await slot.save();
    res.json({
      success: true,
      message: "Signed up successfully"
    });
  } catch(error) {
    console.log(error);
    res.status(500).json({
      success:false,
      error:"Failed to signup slot"
    });
  }
});

app.post("/leaveSlot/:slotID", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const slotID = Number(req.params.slotID);
    const now = Date.now();
    const slot = await Slot.findOne({
      slotID
    });
    if (!slot) {
      return res.status(404).json({
        success: false,
        error: "Slot not found"
      });
    }
    const memberIndex = slot.members.findIndex(
      m => m.userId === Number(userId)
    );
    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        error: "Not signed up"
      });
    }
    if (Number(slot.start) - now < 2 * 60 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        error: "Cannot leave slot less than 2 hours away"
      });
    }
    slot.members.splice(memberIndex, 1);
    await slot.save();
    res.json({
      success: true,
      message: "Left slot successfully"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to leave slot"
    });
  }
});


// Public search signup sheets (no token needed)
app.get("/public/signupSheets", async (req, res) => {
  try {
    const query = (req.query.course || "")
      .trim();
    if (!query) {
      const sheets = await Signup.find();

      return res.json(sheets);
    }
    const matchedSheets = await Signup.find({
      $or: [
        {
          courseName: {
            $regex: query,
            $options: "i"
          }
        },
        {
          termCode: {
            $regex: query,
            $options: "i"
          }
        }
      ]
    });
    res.json(matchedSheets);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to search signup sheets"
    });
  }
});

// Public get slots for a signup sheet (no token needed)
app.get('/public/slots/:signupID', async (req, res) => {
  try {
    const signupID = Number(req.params.signupID);
    const sheetSlots = await Slot.find({
      signupID
    });
    if (sheetSlots.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No slots found for this signup sheet"
      });
    }
    res.json({
      success: true,
      slots: sheetSlots
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to get slots"
    });
  }
});


app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
});

