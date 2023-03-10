const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth')
const { check, validationResult } = require('express-validator')

const Profile = require('../../models/Profile')
const Users = require('../../models/User');
const User = require('../../models/User');

// @route  get api/profile/me
// @desc   get current users profile
// @access private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' })
        }
        res.json(profile)

    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
    }
});
// @route  post api/profile
// @desc   Create or update user Profile
// @access private
router.post('/', [auth, [
    check('status', 'Status is required')
        .not()
        .isEmpty(),

    check('skills', 'skill is required')
        .not()
        .isEmpty(),
]],

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const {
            company,
            website,
            location,
            status,
            skills,
            bio,
            githubusername,
            youtube,
            twitter,
            facebook,
            linkedin,
            instagram,
        } = req.body;

        //build profile object
        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim())
        }

        //Build social object
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (instagram) profileFields.social.instagram = instagram;

        try {
            let profile = await Profile.findOne({ user: req.user.id });

            if (profile) {
                //update
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                )

                return res.json(profile);
            }
            //create
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile)


        } catch (err) {
            console.error(error.message)
            res.status(500).send('Server Error')
        }
    })

// @route  get api/profile
// @desc   get all profile
// @access public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Send Error')

    }
})
// @route  get api/profile/user/user_id
// @desc   get profile by user ID
// @access public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

        if (!profile) return res.status(400).json({ msg: 'Profile not found' })

        res.json(profile);
    } catch (err) {
        console.error(err.message)

        if (err.kind == 'objectId') {
            return res.status(400).json({ msg: 'Profile not found' })
        }

        res.status(500).send('Send Error')

    }
})

// @route  Delete api/profile
// @desc   delete profile, user and posts
// @access Private
router.delete('/', auth, async (req, res) => {
    try {
        //@todo - remove users posts

        // Remove profile
        await Profile.findOneAndRemove({ user: req.user.id });

        //remove user
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User delete' });
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Send Error')

    }
})

// @route  PUT api/profile/experience
// @desc  add profile experience
// @access private
router.put('/experience', [auth, [
    check('title', 'Title is required')
        .not()
        .isEmpty(),
    check('company', 'Company is required')
        .not()
        .isEmpty(),
    check('from', 'From date is required')
        .not()
        .isEmpty()
]
],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id })

            if (!profile) {
                return res.status(404).json({ msg: 'Profile not found' })
            }

            profile.experience.unshift(newExp)

            await profile.save()

            res.json(profile)
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error')
        }
    }
)


// @route  Delete api/profile/experience/:exp_id
// @desc  Delete experience from profile
// @access private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })

        //Get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id)
        profile.experience.splice(removeIndex, 1)

        await profile.save()

        res.json(profile)

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})


// @route  PUT api/profile/education
// @desc  add profile education
// @access private

router.put(
    '/education',
    [
        auth,
        [
            check('school', 'School is required')
                .not()
                .isEmpty(),
            check('degree', 'Degree is required')
                .not()
                .isEmpty(),
            check('fieldofstudy', 'Field of study is required')
                .not()
                .isEmpty(),
            check('from', 'From date is required')
                .not()
                .isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body

        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id })

            profile.education.unshift(newEdu)

            await profile.save()

            res.json(profile)
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error')
        }
    }
)


// @route  Delete api/profile/education/:edu_id
// @desc  Delete education from profile
// @access private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })

        //Get remove index
        const removeIndex = profile.education
            .map(item => item.id)
            .indexOf(req.params.edu_id)
        profile.education.splice(removeIndex, 1)

        await profile.save()

        res.json(profile)

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
})


// update profile
// router.put('/profile', auth, async (req, res) => {
//     const {
//         name,
//         email,
//         bio,
//         website,
//         location
//     } = req.body;

//     // Build profile object
//     const profileFields = {};
//     if (name) profileFields.name = name;
//     if (email) profileFields.email = email;
//     if (bio) profileFields.bio = bio;
//     if (website) profileFields.website = website;
//     if (location) profileFields.location = location;

//     try {
//         let profile = await Profile.findOne({ user: req.user.id });

//         if (!profile) {
//             return res.status(404).json({ msg: 'Profile not found' });
//         }

//         // Update profile
//         profile = await Profile.findOneAndUpdate(
//             { user: req.user.id },
//             { $set: profileFields },
//             { new: true }
//         );

//         res.json(profile);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }

// })



module.exports = router; 