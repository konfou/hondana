from flask import Flask, render_template, json, jsonify, send_from_directory
import requests
import database, source
import webbrowser

app = Flask(__name__)

@app.errorhandler(404)
@app.route("/")
def index(whatever=""):
    return render_template("index.html")

@app.route("/mangas/<path:filename>")
def mangas_data(filename):
    return send_from_directory("hondana_data/mangas_data/", filename)

@app.route("/api/")
@app.route("/api/<path:args>")
def api(args=""):
    args = args.rstrip("/").split("/")
    if args[0] == "mangas":
        return jsonify(database.get_mangas_info())
    elif args[0] == "sources":
        return jsonify([s.name for s in source.sources])
    elif args[0] == "manga" and len(args) >= 2 and args[1].isdigit():
        i = int(args[1])
        manga = database.get_manga(i)
        if manga is None:
            return jsonify("Invalid id")

        if len(args) == 2:
            return jsonify(database.to_dict(manga))
        elif len(args) == 3 and args[2] == "update_info":
            return jsonify(database.update_manga_info(i))
        elif len(args) == 4 and args[2] == "get_chapters_list":
            return jsonify(manga.get_chapters_list(int(args[3])))
        elif len(args) == 5 and args[2] == "download_chapter":
            return jsonify(manga.download_chapter(int(args[3]), int(args[4])))
        elif len(args) == 4 and args[2] == "set_chapter_read":
            return jsonify(manga.set_chapter_read(int(args[3])))
        else:
            return jsonify("Invalid args")
    elif args[0] == "search_anilist" and len(args) == 2:
        return jsonify(database.search_anilist(args[1]))
    elif args[0] == "add_manga" and len(args) == 2:
        return jsonify(database.add_manga(args[1]))
    else:
        return jsonify("Invalid args")

database.open_database()
app.run(port=80, debug=True)