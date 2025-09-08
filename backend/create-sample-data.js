const mongoose = require('mongoose');
require('dotenv').config();

const courseSchema = new mongoose.Schema({
  name: String,
  code: String,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  role: String
});

const Course = mongoose.model('Course', courseSchema);
const User = mongoose.model('User', userSchema);

async function createSampleData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find all teachers
    const teachers = await User.find({ role: 'teacher' });
    if (teachers.length === 0) {
      console.log('No teachers found. Please register a teacher first.');
      return;
    }
    
    console.log(`Found ${teachers.length} teacher(s)`);
    
    // Create sample courses for each teacher
    for (const teacher of teachers) {
      const courses = [
        {
          name: 'Computer Science Fundamentals',
          code: `CS101_${teacher._id.toString().slice(-4)}`,
          teacher: teacher._id,
          description: 'Introduction to Computer Science',
          students: []
        },
        {
          name: 'Data Structures',
          code: `CS201_${teacher._id.toString().slice(-4)}`,
          teacher: teacher._id,
          description: 'Data Structures and Algorithms',
          students: []
        }
      ];
      
      for (const courseData of courses) {
        const existingCourse = await Course.findOne({ code: courseData.code });
        if (!existingCourse) {
          await Course.create(courseData);
          console.log(`Created course: ${courseData.name} for teacher: ${teacher.name}`);
        }
      }
    }
    
    console.log('Sample data created successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createSampleData();