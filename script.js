alert("Lucky Nitro JS Loaded");

const canvas = document.getElementById("gameCanvas");

alert(canvas);

const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.fillStyle = "red";
ctx.fillRect(100, 100, 200, 200);
