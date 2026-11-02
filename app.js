
const http = require("http");
const fs = require("fs");
const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const url = "mongodb://127.0.0.1:27017";

const client = new MongoClient(url);

const server = http.createServer(async function(req, res) {

    // Display Home Page

    if (req.url === "/" && req.method === "GET") {

        res.writeHead(200, { "Content-Type": "text/html" });

        fs.createReadStream("./URK24CS1249_Exp10.html").pipe(res);

    }


    // Handle Form Submission

    else if (req.url === "/server" && req.method === "POST") {

        let rawData = "";

        req.on("data", function(data) {

            rawData += data;

        });

        req.on("end", async function() {

            try {

                const inputData = new URLSearchParams(rawData);

                // Extract Form Values

                const name = inputData.get("name");
                const password = inputData.get("password");
                const age = Number(inputData.get("age"));
                const mobile = inputData.get("mobile");
                const email = inputData.get("email");
                const gender = inputData.get("gender");
                const state = inputData.get("state");
                const skills = inputData.getAll("skills");

                // Server-side Validation

                if (
                    !name || !/^[A-Za-z ]+$/.test(name) ||
                    !password ||
                    !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}/.test(password) ||
                    !Number.isInteger(age) || age < 18 || age > 30 ||
                    !/^[0-9]{10}$/.test(mobile) ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
                    !["Male", "Female"].includes(gender) ||
                    !state || skills.length === 0
                ) {

                    res.writeHead(400, {
                        "Content-Type": "text/html"
                    });

                    res.end("<h2>Invalid form details. Please go back and check your entries.</h2>");

                    return;

                }

                // Hash password before storing

                const salt = crypto.randomBytes(16).toString("hex");

                const passwordHash = crypto.scryptSync(
                    password, salt, 64
                ).toString("hex");

                // Create Registration Object

                const user = {

                    name: name,
                    passwordHash: passwordHash,
                    passwordSalt: salt,
                    age: age,
                    mobile: mobile,
                    email: email,
                    gender: gender,
                    state: state,
                    skills: skills

                };

                // Store Data in MongoDB

                const db = client.db("gardenDB");

                const collection = db.collection("registrations");

                await collection.insertOne(user);

                // Display Submitted Details

                res.writeHead(200, {
                    "Content-Type": "text/html"
                });

                res.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Registration Details</title>

                        <style>
                            body {
                                font-family: Arial;
                                background: #eef7ee;
                                text-align: center;
                            }

                            h1 {
                                color: darkgreen;
                            }

                            table {
                                width: 70%;
                                margin: 30px auto;
                                background: white;
                                border-collapse: collapse;
                            }

                            td, th {
                                border: 1px solid #999;
                                padding: 15px;
                                text-align: left;
                            }

                            th {
                                background: darkgreen;
                                color: white;
                            }

                            a {
                                color: green;
                            }
                        </style>

                    </head>

                    <body>

                        <h1>🌿 User Submitted Details</h1>

                        <table>

                            <tr>
                                <th>Field</th>
                                <th>Details</th>
                            </tr>

                            <tr>
                                <td>Name</td>
                                <td>${escapeHTML(name)}</td>
                            </tr>

                            <tr>
                                <td>Password</td>
                                <td>Saved securely</td>
                            </tr>

                            <tr>
                                <td>Age</td>
                                <td>${age}</td>
                            </tr>

                            <tr>
                                <td>Mobile Number</td>
                                <td>${escapeHTML(mobile)}</td>
                            </tr>

                            <tr>
                                <td>Email</td>
                                <td>${escapeHTML(email)}</td>
                            </tr>

                            <tr>
                                <td>Gender</td>
                                <td>${escapeHTML(gender)}</td>
                            </tr>

                            <tr>
                                <td>State</td>
                                <td>${escapeHTML(state)}</td>
                            </tr>

                            <tr>
                                <td>Skills</td>
                                <td>${skills.map(escapeHTML).join(", ")}</td>
                            </tr>

                        </table>

                        <h3 style="color:green;">
                            Registration Successful!
                        </h3>

                        <a href="/">Back to Registration</a>

                    </body>
                    </html>
                `);

                res.end();

            }

            catch (error) {

                console.log(error);

                res.writeHead(500, {
                    "Content-Type": "text/html"
                });

                res.end("<h2>Unable to process registration.</h2>");

            }

        });

    }

    else {

        res.writeHead(404, {
            "Content-Type": "text/html"
        });

        res.end("<h2>Page Not Found</h2>");

    }

});


// Escape user input before displaying it as HTML

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, function(char) {

        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"

        }[char];

    });

}


// Connect MongoDB and Start Server

async function startServer() {

    try {

        await client.connect();

        console.log("MongoDB Connected Successfully");

        server.listen(5000, function() {

            console.log("Server running at http://localhost:5000");

        });

    }

    catch (error) {

        console.log("MongoDB Connection Error:", error);

    }

}

startServer();
