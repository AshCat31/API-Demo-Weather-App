const express = require("express");

const app = express();
const PORT = 3000;
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
const posts = [
    {
        title: "Post Title",
        name: "Author",
        date: new Date(),
        category: "Technology",
        content: "Content..."
    },
    {
        title: "A Long Winded and Unnecessary Introduction to Cooking my Favorite Recipe",
        name: "First Lastname",
        date: new Date("2026-09-14"),
        category: "Food",
        content: "This is a long winded and wholly necessary introduction to my favorite dish. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet."
    }
];
app.get("/", (req, res) => {
    res.render("index", { posts });
});
app.post("/posts", (req, res) => {
    const { name, title, category, content } = req.body;
    posts.push({ name, title, category, content, date: new Date() });
    res.redirect("/");
});
app.post("/posts/:index/edit", (req, res) => {
    const index = Number(req.params.index);
    if (!posts[index]) return res.redirect("/");
    const { name, title, category, content } = req.body;
    posts[index].name = name;
    posts[index].title = title;
    posts[index].category = category;
    posts[index].content = content;
    res.redirect("/");
});
app.post("/posts/:index/delete", (req, res) => {
    const index = Number(req.params.index);
    if (posts[index]) posts.splice(index, 1);
    res.redirect("/");
});
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});