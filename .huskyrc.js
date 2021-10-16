const tasks = (arr) => arr.join(" && ")

module.exports = {
    hooks: {
        "pre-commit": tasks(["pretty-quick --staged"]),
        "pre-push": "npm run test",
    },
}
