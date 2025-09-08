import { Router } from 'express';
import Course from '../models/Course';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    
    let query = {};
    if (role === 'teacher') {
      query = { teacher: userId };
    }
    
    const courses = await Course.find(query)
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses'
    });
  }
});

router.post('/create', async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const teacherId = req.user?.userId;
    
    // Check if course already exists for this teacher
    let course = await Course.findOne({ code, teacher: teacherId });
    
    if (!course) {
      course = new Course({
        name,
        code,
        description,
        teacher: teacherId,
        students: []
      });
      await course.save();
    }
    
    res.json({
      success: true,
      data: { course }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create course'
    });
  }
});

router.get('/:id/students', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('students', 'name email studentId');
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }
    
    // Get all students for demo (since we don't have enrollment system)
    const allStudents = await require('../models/User').default.find({ role: 'student' }).select('name email studentId');
    
    res.json({
      success: true,
      data: { students: allStudents }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get course students'
    });
  }
});

export default router;