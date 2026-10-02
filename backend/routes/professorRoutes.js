const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                prof_id,
                first_name,
                last_name,
                email
            FROM Professors
            ORDER BY last_name
            `);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to fetch professors"
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                p.prof_id,
                p.first_name,
                p.last_name,
                p.email,
                d.dep_name AS department,
                u.uni_name AS university
            FROM Professors p
            JOIN Departments d
                ON p.department_id = d.dep_id
            JOIN universities u
                ON d.uni_id = u.uni_id
            WHERE p.prof_id = $1;
            `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Professor not found"
            });
        }

        const coursesResult = await pool.query(`
        SELECT
           c.course_id,
           c.course_name,
           c.code
        FROM Professor_Courses pc
        JOIN Courses c
           ON pc.course_id = c.course_id
        WHERE pc.professor_id = $1
        ORDER BY c.course_name;
        `, [id]);

        res.json({
            ...result.rows[0],
            courses: coursesResult.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to fetch professor"
        });
    }
});

router.get("/:prof_id/reviews", async (req, res) => {
    try {
        const { prof_id } = req.params;

        const reviewsResult = await pool.query(`
            SELECT
               r.id,
               r.rating,
               r.difficulty,
               r.comment,
               r.created_at,
               u.name AS user_name,
               c.course_name
            FROM Reviews r
            JOIN Users u
               ON r.user_id = u.userid
            JOIN Courses c
               ON r.course_id = c.course_id
            WHERE r.professor_id = $1
            ORDER BY r.created_at DESC;
            `, [prof_id]);

        const statsResult = await pool.query(`
            SELECT
               ROUND(AVG(rating), 2) AS average_rating,
               COUNT(*) AS review_count
            FROM Reviews
            WHERE professor_id = $1;
            `, [prof_id]);

        res.json({
            averageRating: Number(statsResult.rows[0].average_rating) || 0,
            reviewCount: Number(statsResult.rows[0].review_count),
            reviews: reviewsResult.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to fetch reviews"
        });
    }
});

module.exports = router;