CALL tsc -p .\source_js
CALL browserify .\source_js\app.js > .\static\main.js
CALL py -3 app.py