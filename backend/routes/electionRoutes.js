import express from 'express';
import Election from '../models/Election.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const populateElection = (query) =>
  query
    .populate('createdBy', 'name email')
    .populate('posts.candidates.userId', 'name email studentId department year');

const serializeElectionForUser = (election, userId) => {
  const electionObject = election.toObject ? election.toObject() : election;
  const normalizedUserId = userId?.toString();

  return {
    ...electionObject,
    posts: electionObject.posts.map((post) => ({
      ...post,
      hasUserVoted: post.voters.some((voterId) => voterId.toString() === normalizedUserId),
      userNomineeCandidateId:
        post.candidates.find((candidate) => candidate.userId?._id?.toString?.() === normalizedUserId || candidate.userId?.toString?.() === normalizedUserId)?._id || null
    }))
  };
};

// @desc    Create a new election
// @route   POST /api/elections
// @access  Super Admin only
router.post('/', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const { title, startDate, endDate } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide title, start date, and end date' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Initialize posts with default structure
    const posts = [
      { name: 'President', maxVotes: 1, candidates: [], voters: [] },
      { name: 'Vice President', maxVotes: 1, candidates: [], voters: [] },
      { name: 'Cultural Secretary', maxVotes: 1, candidates: [], voters: [] },
      { name: 'Vice Cultural Secretary', maxVotes: 1, candidates: [], voters: [] },
      { name: 'Technical Secretary', maxVotes: 1, candidates: [], voters: [] },
      { name: 'Vice Technical Secretary', maxVotes: 1, candidates: [], voters: [] },
      { name: 'Sports Secretary', maxVotes: 1, candidates: [], voters: [] },
      { name: 'Vice Sports Secretary', maxVotes: 1, candidates: [], voters: [] },
      { name: 'Joint Secretary', maxVotes: 2, candidates: [], voters: [] }
    ];

    const election = await Election.create({
      title,
      startDate: start,
      endDate: end,
      posts,
      createdBy: req.user._id,
      isActive: false
    });

    res.status(201).json(election);
  } catch (error) {
    console.error('Create election error:', error);
    res.status(500).json({ message: error.message || 'Failed to create election' });
  }
});

// @desc    Get all elections
// @route   GET /api/elections
// @access  Protected
router.get('/', protect, async (req, res) => {
  try {
    const elections = await populateElection(
      Election.find().sort({ createdAt: -1 })
    );
    
    res.json(elections.map((election) => serializeElectionForUser(election, req.user._id)));
  } catch (error) {
    console.error('Get elections error:', error);
    res.status(500).json({ message: 'Failed to fetch elections' });
  }
});

// @desc    Get active election
// @route   GET /api/elections/active
// @access  Protected
router.get('/active', protect, async (req, res) => {
  try {
    const now = new Date();
    const election = await populateElection(
      Election.findOne({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      })
    );

    if (!election) {
      return res.status(404).json({ message: 'No active election found' });
    }

    res.json(serializeElectionForUser(election, req.user._id));
  } catch (error) {
    console.error('Get active election error:', error);
    res.status(500).json({ message: 'Failed to fetch active election' });
  }
});

router.get('/student-dashboard', protect, authorize('Student'), async (req, res) => {
  try {
    const now = new Date();
    const activeElection = await populateElection(
      Election.findOne({
        isActive: true,
        endDate: { $gte: now }
      }).sort({ createdAt: -1 })
    );

    if (!activeElection) {
      return res.json({ hasElection: false, election: null });
    }

    res.json({
      hasElection: true,
      election: serializeElectionForUser(activeElection, req.user._id)
    });
  } catch (error) {
    console.error('Get student dashboard election error:', error);
    res.status(500).json({ message: 'Failed to fetch student election summary' });
  }
});

// @desc    Get election by ID
// @route   GET /api/elections/:id
// @access  Protected
router.get('/:id', protect, async (req, res) => {
  try {
    const election = await populateElection(Election.findById(req.params.id));

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    res.json(serializeElectionForUser(election, req.user._id));
  } catch (error) {
    console.error('Get election error:', error);
    res.status(500).json({ message: 'Failed to fetch election' });
  }
});

// @desc    Add candidate to a post
// @route   POST /api/elections/:id/candidates
// @access  Super Admin only
router.post('/:id/candidates', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const { postName, userId } = req.body;

    if (!postName || !userId) {
      return res.status(400).json({ message: 'Please provide post name and user ID' });
    }

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the post
    const post = election.posts.find(p => p.name === postName);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is already a candidate in ANY post
    const isAlreadyCandidate = election.posts.some(p => 
      p.candidates.some(c => c.userId.toString() === userId)
    );

    if (isAlreadyCandidate) {
      return res.status(400).json({ message: 'User is already a candidate in another post' });
    }

    // Add candidate
    post.candidates.push({
      userId: user._id,
      name: user.name,
      department: user.department,
      year: user.year,
      nominatedByStudent: false,
      votes: 0
    });

    await election.save();

    const updatedElection = await populateElection(Election.findById(req.params.id));

    res.json(serializeElectionForUser(updatedElection, req.user._id));
  } catch (error) {
    console.error('Add candidate error:', error);
    res.status(500).json({ message: error.message || 'Failed to add candidate' });
  }
});

// @desc    Remove candidate from a post
// @route   DELETE /api/elections/:id/candidates
// @access  Super Admin only
router.delete('/:id/candidates', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const { postName, candidateId } = req.body;

    if (!postName || !candidateId) {
      return res.status(400).json({ message: 'Please provide post name and candidate ID' });
    }

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const post = election.posts.find(p => p.name === postName);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.candidates = post.candidates.filter(c => c._id.toString() !== candidateId);
    await election.save();

    const updatedElection = await populateElection(Election.findById(req.params.id));

    res.json(serializeElectionForUser(updatedElection, req.user._id));
  } catch (error) {
    console.error('Remove candidate error:', error);
    res.status(500).json({ message: 'Failed to remove candidate' });
  }
});

// @desc    Start/Activate election
// @route   PATCH /api/elections/:id/start
// @access  Super Admin only
router.patch('/:id/start', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Deactivate all other elections
    await Election.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });

    election.isActive = true;
    await election.save();

    res.json({ message: 'Election started successfully', election });
  } catch (error) {
    console.error('Start election error:', error);
    res.status(500).json({ message: 'Failed to start election' });
  }
});

// @desc    End/Deactivate election
// @route   PATCH /api/elections/:id/end
// @access  Super Admin only
router.patch('/:id/end', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    election.isActive = false;
    await election.save();

    res.json({ message: 'Election ended successfully', election });
  } catch (error) {
    console.error('End election error:', error);
    res.status(500).json({ message: 'Failed to end election' });
  }
});

// @desc    Submit nomination request with form details
// @route   POST /api/elections/:id/nominate-request
// @access  Protected (Students)
router.post('/:id/nominate-request', protect, authorize('Student'), async (req, res) => {
  try {
    const { postName, name, year, branch, rollNo, cgpa, hasActiveBacklog } = req.body;

    if (!postName || !name || !year || !branch || !rollNo || cgpa === undefined || hasActiveBacklog === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const now = new Date();
    if (!election.isActive || election.endDate < now) {
      return res.status(400).json({ message: 'Nomination is closed for this election' });
    }

    const post = election.posts.find((p) => p.name === postName);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user already has a pending or approved request in any post
    const hasExistingRequest = election.posts.some((p) =>
      p.nominationRequests.some((nomReq) =>
        nomReq.userId.toString() === req.user._id.toString() &&
        (nomReq.status === 'pending' || nomReq.status === 'approved')
      )
    );

    if (hasExistingRequest) {
      return res.status(400).json({ message: 'You already have a pending or approved nomination request' });
    }

    // Check if already a candidate
    const isAlreadyCandidate = election.posts.some((p) =>
      p.candidates.some((candidate) => candidate.userId.toString() === req.user._id.toString())
    );

    if (isAlreadyCandidate) {
      return res.status(400).json({ message: 'You are already a candidate in this election' });
    }

    post.nominationRequests.push({
      userId: req.user._id,
      name,
      year,
      branch,
      rollNo,
      cgpa: Number(cgpa),
      hasActiveBacklog: hasActiveBacklog === true || hasActiveBacklog === 'true',
      status: 'pending',
      submittedAt: new Date()
    });

    await election.save();

    res.json({
      message: `Nomination request submitted for ${postName}. Awaiting admin approval.`,
      success: true
    });
  } catch (error) {
    console.error('Nomination request error:', error);
    res.status(500).json({ message: error.message || 'Failed to submit nomination request' });
  }
});

// @desc    Get nomination requests for an election (Super Admin)
// @route   GET /api/elections/:id/nomination-requests
// @access  Super Admin only
router.get('/:id/nomination-requests', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)
      .populate('posts.nominationRequests.userId', 'name email studentId')
      .populate('posts.nominationRequests.reviewedBy', 'name email');

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const allRequests = [];
    election.posts.forEach(post => {
      post.nominationRequests.forEach(request => {
        allRequests.push({
          ...request.toObject(),
          postName: post.name,
          postId: post._id
        });
      });
    });

    res.json(allRequests);
  } catch (error) {
    console.error('Get nomination requests error:', error);
    res.status(500).json({ message: 'Failed to fetch nomination requests' });
  }
});

// @desc    Approve or reject nomination request
// @route   PATCH /api/elections/:id/nomination-requests/:requestId
// @access  Super Admin only
router.patch('/:id/nomination-requests/:requestId', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Please provide valid action (approve or reject)' });
    }

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    let foundRequest = null;
    let foundPost = null;

    for (const post of election.posts) {
      const request = post.nominationRequests.id(req.params.requestId);
      if (request) {
        foundRequest = request;
        foundPost = post;
        break;
      }
    }

    if (!foundRequest) {
      return res.status(404).json({ message: 'Nomination request not found' });
    }

    if (foundRequest.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been reviewed' });
    }

    foundRequest.status = action === 'approve' ? 'approved' : 'rejected';
    foundRequest.reviewedAt = new Date();
    foundRequest.reviewedBy = req.user._id;

    // If approved, add to candidates
    if (action === 'approve') {
      foundPost.candidates.push({
        userId: foundRequest.userId,
        name: foundRequest.name,
        department: foundRequest.branch,
        year: foundRequest.year,
        nominatedByStudent: true,
        votes: 0,
        notaVotes: 0
      });
    }

    await election.save();

    res.json({
      message: `Nomination request ${action}d successfully`,
      success: true
    });
  } catch (error) {
    console.error('Review nomination request error:', error);
    res.status(500).json({ message: 'Failed to review nomination request' });
  }
});

// @desc    Student self-nominate to a post (OLD - kept for backward compatibility)
// @route   POST /api/elections/:id/nominate
// @access  Protected (Students)
router.post('/:id/nominate', protect, authorize('Student'), async (req, res) => {
  try {
    const { postName } = req.body;

    if (!postName) {
      return res.status(400).json({ message: 'Please provide post name' });
    }

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const now = new Date();
    if (!election.isActive || election.endDate < now) {
      return res.status(400).json({ message: 'Nomination is closed for this election' });
    }

    const post = election.posts.find((p) => p.name === postName);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isAlreadyCandidate = election.posts.some((p) =>
      p.candidates.some((candidate) => candidate.userId.toString() === req.user._id.toString())
    );

    if (isAlreadyCandidate) {
      return res.status(400).json({ message: 'You are already nominated in this election' });
    }

    post.candidates.push({
      userId: req.user._id,
      name: req.user.name,
      department: req.user.department,
      year: req.user.year,
      nominatedByStudent: true,
      votes: 0
    });

    await election.save();

    const updatedElection = await populateElection(Election.findById(req.params.id));
    res.json({
      message: `You are now nominated for ${postName}`,
      election: serializeElectionForUser(updatedElection, req.user._id)
    });
  } catch (error) {
    console.error('Student nomination error:', error);
    res.status(500).json({ message: error.message || 'Failed to submit nomination' });
  }
});

// @desc    Cast vote (including NOTA)
// @route   POST /api/elections/:id/vote
// @access  Protected (Students)
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { postName, candidateIds, isNota } = req.body;

    if (!postName) {
      return res.status(400).json({ message: 'Please provide post name' });
    }

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Check if election is active
    if (!election.isCurrentlyActive()) {
      return res.status(400).json({ message: 'Election is not currently active' });
    }

    // Find the post
    const post = election.posts.find(p => p.name === postName);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user has already voted for this post
    if (post.voters.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have already voted for this post' });
    }

    // Handle NOTA vote
    if (isNota === true || isNota === 'true') {
      post.notaVotes = (post.notaVotes || 0) + 1;
      post.voters.push(req.user._id);
      await election.save();
      return res.json({ message: 'NOTA vote cast successfully' });
    }

    // Handle regular candidate votes
    if (!candidateIds || !Array.isArray(candidateIds)) {
      return res.status(400).json({ message: 'Please provide candidate IDs array or select NOTA' });
    }

    // Validate number of votes
    if (candidateIds.length > post.maxVotes) {
      return res.status(400).json({
        message: `You can only vote for up to ${post.maxVotes} candidate(s) for this post`
      });
    }

    if (candidateIds.length === 0) {
      return res.status(400).json({ message: 'Please select at least one candidate or NOTA' });
    }

    // Validate all candidate IDs exist in this post
    const validCandidates = candidateIds.every(id =>
      post.candidates.some(c => c._id.toString() === id)
    );

    if (!validCandidates) {
      return res.status(400).json({ message: 'Invalid candidate ID(s)' });
    }

    // Increment votes for selected candidates
    candidateIds.forEach(candidateId => {
      const candidate = post.candidates.find(c => c._id.toString() === candidateId);
      if (candidate) {
        candidate.votes += 1;
      }
    });

    // Add voter to the post
    post.voters.push(req.user._id);

    await election.save();

    res.json({ message: 'Vote cast successfully' });
  } catch (error) {
    console.error('Cast vote error:', error);
    res.status(500).json({ message: error.message || 'Failed to cast vote' });
  }
});

// @desc    Get election results
// @route   GET /api/elections/:id/results
// @access  Protected
router.get('/:id/results', protect, async (req, res) => {
  try {
    const election = await populateElection(Election.findById(req.params.id));

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const results = election.getAllResults();
    res.json({
      title: election.title,
      isActive: election.isActive,
      startDate: election.startDate,
      endDate: election.endDate,
      results
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ message: 'Failed to fetch results' });
  }
});

// @desc    Delete election
// @route   DELETE /api/elections/:id
// @access  Super Admin only
router.delete('/:id', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    await election.deleteOne();
    res.json({ message: 'Election deleted successfully' });
  } catch (error) {
    console.error('Delete election error:', error);
    res.status(500).json({ message: 'Failed to delete election' });
  }
});

// @desc    Get voting status for current user
// @route   GET /api/elections/:id/voting-status
// @access  Protected
router.get('/:id/voting-status', protect, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const votingStatus = election.posts.map(post => ({
      postName: post.name,
      hasVoted: post.voters.includes(req.user._id),
      maxVotes: post.maxVotes
    }));

    res.json(votingStatus);
  } catch (error) {
    console.error('Get voting status error:', error);
    res.status(500).json({ message: 'Failed to fetch voting status' });
  }
});

export default router;

