var $ = function(selector){
    if(selector[0] == "."){
        return document.querySelectorAll(selector);
    }
    else{
        return document.querySelector(selector);
    }
};

var default_settings = {
    "theme": "light",
    "cover_per_row": 6,
    "reader_direction": "left_to_right",
    "chapters_order": "desc",
    "reader_fit": "height"};
var settings = default_settings;

if(localStorage.getItem("settings") != null){
    try{
        settings = JSON.parse(localStorage.getItem("settings"));
        for(var setting in default_settings){
            if(settings[setting] === undefined){
                settings[setting] = default_settings[setting];
            }
        }
    }
    catch(e){
        settings = default_settings;
    }
}
localStorage.setItem("settings", JSON.stringify(settings));

var mangas = [],
    sources = [],
    current_manga,
    current_source,
    current_manga_chapters,
    current_chapter,
    current_page,
    current_view;

switch_theme();
fetch_sources();
update_hoverables();

function fetch_sources(){
    fetch("/api/sources").then(res => {
        return res.json();
    }).then(data => {
        sources = data;
        fetch_mangas();
    });
}

function fetch_mangas(){
    fetch("/api/mangas").then(res => {
        return res.json();
    }).then(data => {
        mangas = [];

        for(var manga of data){
            manga.cover = "/mangas/"+manga.dir+"/"+manga.cover;
            mangas.push(manga);
        }

        mangas.sort(function(a, b){
            if(a.title > b.title) return 1;
            if(a.title < b.title) return -1;
            return 0;
        });

        set_library_view();
    });
}

function set_library_view(){
    current_view = "library";
    $("#view-name").innerHTML = "Library";
    $("#header-burger-button").classList.toggle("invisible", false);
    $("#header-return-button").classList.toggle("invisible", true);
    $("#header").classList.toggle("manga-add-header", false);
    $("#add-manga-button").classList.toggle("invisible", false);
    $("#search-bar").querySelector("input").value = "";
    $("#search-bar").querySelector("i").classList.toggle("invisible", false);
    $("#search-bar").querySelector("input").placeholder = "Search library...";
    hide_views();
    $("#library-view").classList.toggle("invisible", false);
    generate_covers(settings["cover_per_row"], mangas, null);
    $("#search-bar").classList.toggle("invisible", false);
}

function generate_covers(cover_per_row, mangas, filter){
    if(mangas.length == 0){
        $("#library-empty").style.display = "inherit";
        $("#zoom-slider-container").style.display = "none";
        return;
    }

    $("#library-empty").style.display = "none";
    $("#zoom-slider-container").style.display = "inherit";

    cover_per_row = parseInt(cover_per_row);

    var covers_container = $("#covers-container");
    covers_container.innerHTML = "";

    var rows_number = Math.ceil(mangas.length/cover_per_row);
    var rows = [];

    for(var i = 0; i < rows_number; i++){
        var row = document.createElement("div");
        row.className = "covers-row";
        rows.push(row);
        covers_container.append(row);
    }

    var cover_margin = getComputedStyle(document.body).getPropertyValue("--cover-margin");
    cover_margin = parseInt(cover_margin.slice(0, -2));
    var width = (rows[0].offsetWidth-(cover_margin*(cover_per_row)))/cover_per_row;

    for(var i = 0; i < mangas.length; i++){
        var manga = mangas[i];
        if(filter != null){
            if(manga.title.toLowerCase().indexOf(filter) == -1) continue;
        }
        var cover = document.createElement("div");
        cover.className = "cover";
        cover.id = "cover-"+manga.id;
        cover.style.width = width+"px";
        cover.style.height = (width*1.5)+"px";
        cover.style.backgroundImage = "url("+manga.cover+")";
        var cover_title = document.createElement("div");
        cover_title.className = "cover-title";
        cover_title.innerHTML = "<span>"+manga.title+"</span>";
        cover_title.style.fontSize = (width/12)+"px";
        cover_title.childNodes[0].style.bottom = (width/14)+"px";
        cover_title.childNodes[0].style.left = (width/14)+"px";
        cover.append(cover_title);
        rows[Math.floor(i/cover_per_row)].append(cover);
        rows[Math.floor(i/cover_per_row)].style.height = cover.offsetHeight+"px";

        (function(i){
            cover.onclick = function(){
                current_manga = i;
                set_manga_view();
            };
        })(i);
    }
}

$("#zoom-slider").oninput = function(){
    update_settings("cover_per_row", this.value);
    generate_covers(settings["cover_per_row"], mangas, null);
};

$("#zoom-slider").value = settings["cover_per_row"];

window.onresize = function(){
    generate_covers(settings["cover_per_row"], mangas, null);
};

function update_settings(setting, value){
    settings[setting] = value;
    localStorage.setItem("settings", JSON.stringify(settings));
}

$("#theme-button").onclick = function(){
    var theme = settings["theme"] == "dark" ? "light" : "dark";
    update_settings("theme", theme);
    switch_theme();
};

function switch_theme(){
    var button = $("#theme-button i");
    button.classList.toggle("fa-sun", settings["theme"] == "light");
    button.classList.toggle("fa-moon", settings["theme"] == "dark");
    var attr = settings["theme"][0].toUpperCase()+settings["theme"].slice(1)+" theme";
    button.setAttribute("data-hover", attr);
    $("#tooltip").innerHTML = attr;
    document.body.setAttribute("data-theme", settings["theme"]);
}

$("#header-return-button").onclick = function(){
    set_library_view();
};

$("#header-burger-button").onclick = function(){
    $("#overlay").style.visibility = "inherit";
    $("#overlay").style.opacity = "1";
    $("#sidenav").style.visibility = "inherit";
    $("#sidenav").style.left = "0px";
};

$("#close-sidenav-button").onclick = $("#overlay").onclick = close_sidebar;

function close_sidebar(){
    $("#overlay").style.visibility = "hidden";
    $("#overlay").style.opacity = "0";
    $("#sidenav").style.visibility = "hidden";
    $("#sidenav").style.left = "-330px";
}

function hide_views(){
    var view_elems = $(".view");
    for(var view_elem of view_elems){
        view_elem.classList.toggle("invisible", true);
    }
    $("#not-reader").classList.toggle("invisible", false);
    $("#reader-view").classList.toggle("invisible", true);
}

function set_manga_view(){
    $("#header-burger-button").classList.toggle("invisible", true);
    $("#header-return-button").classList.toggle("invisible", false);
    $("#header").classList.toggle("manga-add-header", false);
    $("#add-manga-button").classList.toggle("invisible", true);
    current_source = 0;

    var manga = mangas[current_manga];
    $("#view-name").innerHTML = manga.title;
    hide_views();
    $("#manga-view").classList.toggle("invisible", false);

    var width = 300;
    $("#manga-cover").src = manga.cover;

    $("#manga-title").innerHTML = manga.title;
    $("#manga-subtitle").innerHTML = manga.subtitle;
    $("#manga-author").innerHTML = manga.author;
    $("#manga-status").innerHTML = manga.status;
    $("#manga-description").innerHTML = manga.description;
    $("#manga-genres").innerHTML = manga.genres.join(", ");

    $("#search-bar").classList.toggle("invisible", true);

    $("#manga-sources-tabs").innerHTML = "";
    for(var i = 0; i < sources.length; i++){
        var tab_active = i == current_source ? "active" : "";
        var tab_elem = document.createElement("div");
        tab_elem.classList = "tab "+tab_active;

        tab_elem.innerHTML = sources[i];
        $("#manga-sources-tabs").appendChild(tab_elem);

        (function(elem, i){
            elem.onclick = function(){
                if(i != current_source){
                    $(".tab.active")[0].classList.toggle("active");
                    elem.classList.toggle("active");
                    switch_source(i);
                }
            };
        })(tab_elem, i);
    }
    var placeholder = document.createElement("div");
    placeholder.classList = "tab-placeholder";
    $("#manga-sources-tabs").append(placeholder);

    display_chapters_list();
}

function switch_source(sourceId){
    current_source = sourceId;
    display_chapters_list();
}

var chapters_list_aborter = null;

$("#chapters-sort").onclick = function(){
    settings["chapters_order"] = settings["chapters_order"] == "desc" ? "asc" : "desc";
    var list = $("#chapters-list");
    for(var i = 1; i < list.childNodes.length; i++){
        list.insertBefore(list.childNodes[i], list.firstChild);
    }
}

async function fetch_chapters_list(manga, source, signal){
    var res = await fetch("/api/manga/"+manga.id+"/get_chapters_list/"+source, {signal})
    var data = await res.json();
    return data;
}

function display_chapters_list(){
    var manga = mangas[current_manga];

    $("#chapters-list").innerHTML = `<div class="big-thing-in-center">
            <div class="loader"></div><br>
            Loading
        </div>`;

    if(chapters_list_aborter){
        chapters_list_aborter.abort();
    }

    chapters_list_aborter = new AbortController();
    var signal = chapters_list_aborter.signal;

    fetch_chapters_list(manga, current_source, signal).then(data => {
        if(data.length > 0){
            $("#chapters-list").innerHTML = "";
        }
        else{
            $("#chapters-list").innerHTML = `<div class="big-thing-in-center">
                <i class="fas fa-book-open"></i><br>
                No chapters
            </div>`;
        }

        current_manga_chapters = data;

        data.sort(function(a, b){
            return a.id - b.id;
        });

        for(var i = 0; i < data.length; i++){
            create_chapter_line(i, data[i], manga);
        }
        update_hoverables();
    });
}

function create_chapter_line(i, chapter, manga){
    var elem = document.createElement("div");
    elem.classList = "manga-chapter";

    chapter_html = `<div class="chapter-title">`+chapter.title+` `+(chapter.read ? "(Read)" : "")+
                (chapter.downloaded ? "(Downloaded)" : "")+
                `</div><div class="manga-chapter-buttons">`;

    if(current_source == 0){
        chapter_html += `<i class="fas fa-book-open hoverable" data-hover="Read chapter"></i>`;
    }
    else{
        chapter_html += `<i class="fas fa-arrow-down hoverable" data-hover="Download chapter"></i>`;
    }

    chapter_html += `</div>`;
    elem.innerHTML = chapter_html;

    (function(i, chapter){
        elem.querySelector("i").onclick = function(e){
            if(current_source == 0){
                current_chapter = i;
                set_reader_view(0);
                e.stopPropagation();
            }
            else{
                fetch("/api/manga/"+manga.id+"/download_chapter/"+current_source+"/"+chapter.id);
                this.parentNode.parentNode.querySelector(".chapter-title").innerHTML += "(Downloading)";
            }
        };
    })(i, chapter);

    if(settings["chapters_order"] == "desc"){
        $("#chapters-list").insertBefore(elem, $("#chapters-list").firstChild);
    }
    else{
        $("#chapters-list").appendChild(elem);
    }
}

$("#sidenav-library").onclick = function(){
    close_sidebar();
    set_library_view();
};

function update_hoverables(){
    var hoverables = $(".hoverable");
    for(var hoverable of hoverables){
        (function(hoverable){
            hoverable.onmouseenter = function(){
                $("#tooltip").innerHTML = this.getAttribute("data-hover");
                $("#tooltip").style.display = "inline-block";
                var offset = this.getBoundingClientRect();
                $("#tooltip").style.top = (offset.height+offset.top+10)+"px";
                $("#tooltip").style.left = (offset.left+offset.width/2-$("#tooltip").offsetWidth/2)+"px";
            };
            hoverable.onmouseleave = function(){
                $("#tooltip").style.display = "none";
            };
        })(hoverable);
    }
}

var search_aborter = null;

$("#search-bar input").oninput = function(){
    $("#search-bar-suggestions").classList.toggle("not-empty", false);
    if(current_view == "library"){
        generate_covers(settings["cover_per_row"], mangas, this.value);
    }
    else if(current_view == "add_manga" && this.value.length > 0){
        $("#search-bar-suggestions").innerHTML = "";
        if(search_aborter){
            search_aborter.abort();
        }

        search_aborter = new AbortController();
        var signal = search_aborter.signal;

        fetch("/api/search_anilist/"+this.value, {signal}).then(function(res){
            return res.json();
        }).then(function(data){
            if(data.length > 0){
                $("#search-bar-suggestions").classList.toggle("not-empty", true);
            }

            for(var suggestion of data){
                var suggestion_element = document.createElement("div");
                suggestion_element.innerHTML = suggestion;
                $("#search-bar-suggestions").appendChild(suggestion_element);
                (function(suggestion){
                    suggestion_element.onclick = function(){
                        fetch("/api/add_manga/"+suggestion).then(function(res){
                            return res.json();
                        }).then(function(data){
                            fetch_mangas();
                        });
                    }
                })(suggestion);
            }
        });
    }
};

function set_reader_view(page){
    current_page = page;
    var chapter = current_manga_chapters[current_chapter];

    $("#not-reader").classList.toggle("invisible", true);
    $("#reader-view").classList.toggle("invisible", false);
    set_direction_button();
    set_fit_button();
    $("#reader-page-container").classList.toggle("fit-width", settings["reader_fit"] == "width");
    $("#reader-top-title").innerHTML = mangas[current_manga].title+" - "+chapter.title;

    set_reader_page();
}

function check_reader_chapters_button(){
    var right_chapter_exist = current_chapter == 0 && settings["reader_direction"] == "right_to_left";
    right_chapter_exist |= current_chapter == current_manga_chapters.length-1 && settings["reader_direction"] == "left_to_right";
    $("#reader-bottom-button-right").classList.toggle("button-disabled", right_chapter_exist);
    var left_chapter_exist = current_chapter == 0 && settings["reader_direction"] == "left_to_right";
    left_chapter_exist |= current_chapter == current_manga_chapters.length-1 && settings["reader_direction"] == "right_to_left";
    $("#reader-bottom-button-left").classList.toggle("button-disabled", left_chapter_exist);
}

function set_reader_page(){
    check_reader_chapters_button();
    var chapter = current_manga_chapters[current_chapter];
    var manga = mangas[current_manga];
    $("#reader-page").src = "mangas/"+manga.dir+"/"+chapter.id+"/"+current_page+"."+chapter.image_format;

    if(current_page == chapter.n_pages-1){
        fetch("/api/manga/"+manga.id+"/set_chapter_read/"+chapter.id);
    }


    if(settings["reader_direction"] == "right_to_left"){
        $("#chapter-page-left").innerHTML = chapter.n_pages;
        $("#chapter-page-right").innerHTML = current_page+1;
        $("#reader-bottom-slider").max = chapter.n_pages-1;
        $("#reader-bottom-slider").value = chapter.n_pages-current_page-1;
    }
    else{
        $("#chapter-page-left").innerHTML = current_page+1;
        $("#chapter-page-right").innerHTML = chapter.n_pages;
        $("#reader-bottom-slider").max = chapter.n_pages-1;
        $("#reader-bottom-slider").value = current_page;
    }

    if(settings["reader_fit"] == "width"){
        $("#reader-page-container").scrollTop = 0;
    }
}

$("#reader-bottom-slider").oninput = function(){
    var chapter = current_manga_chapters[current_chapter];
    current_page = parseInt(this.value);
    if(settings["reader_direction"] == "right_to_left"){
        current_page = chapter.n_pages-current_page-1;
    }
    set_reader_page();
};

$("#reader-view").onclick = function(e){
    var chapter = current_manga_chapters[current_chapter];
    var next = false;
    if(e.clientX > this.offsetWidth/2){
        next = true;
    }
    if(settings["reader_direction"] == "right_to_left") next = !next;

    if(!next){
        if(current_page > 0){
            current_page--;
        }
        else{
            previous_chapter();
        }
    }

    if(next){
        if(current_page < chapter.n_pages-1){
            current_page++;
        }
        else{
            next_chapter();
        }
    }

    set_reader_page();
};

$("#reader-close-button").onclick = function(e){
    set_manga_view();
};

$("#reader-direction-button").onclick = function(){
    var direction = settings["reader_direction"] == "left_to_right" ? "right_to_left" : "left_to_right";
    update_settings("reader_direction", direction);
    set_direction_button();
    set_reader_page();
};

function set_direction_button(){
    var right = settings["reader_direction"] == "right_to_left";
    var button = $("#reader-direction-button i");
    var attr = right ? "Right to left" : "Left to right";

    $("#reader-bottom-slider").classList.toggle("slider-right", right);
    button.classList.toggle("fa-long-arrow-alt-right", !right);
    button.classList.toggle("fa-long-arrow-alt-left", right);
    button.setAttribute("data-hover", attr);
    $("#tooltip").innerHTML = attr;
}

$("#reader-fit-button").onclick = function(){
    var fit = settings["reader_fit"] == "width" ? "height" : "width";
    update_settings("reader_fit", fit);
    $("#reader-page-container").classList.toggle("fit-width", settings["reader_fit"] == "width");
    set_fit_button();
};

function set_fit_button(){
    var button = $("#reader-fit-button i");
    var width = settings["reader_fit"] == "width";
    var attr = width ? "Fit to width" : "Fit to height";
    button.classList.toggle("fa-arrows-alt-h", width);
    button.classList.toggle("fa-arrows-alt-v", !width);
    button.setAttribute("data-hover", attr);
    $("#tooltip").innerHTML = attr;
}

$("#reader-bottom-button-left").onclick = $("#reader-bottom-button-right").onclick = function(){
    if(settings["reader_direction"] == "right_to_left" ^ this.id == "reader-bottom-button-left"){
        previous_chapter();
    }
    else{
        next_chapter();
    }
};

function previous_chapter(){
    if(current_chapter > 0){
        current_chapter--;
        set_reader_view(current_manga_chapters[current_chapter].n_pages-1);
    }
}

function next_chapter(){
    if(current_chapter < current_manga_chapters.length-1){
        current_chapter++;
        set_reader_view(0);
    }
}

$("#reader-bottom").onclick = $("#reader-top").onclick = function(e){
    e.stopPropagation();
};

$("#add-manga-button").onclick = function(){
    $("#header").classList.toggle("manga-add-header", true);
    generate_covers(settings["cover_per_row"], mangas, null);
    $("#search-bar-suggestions").innerHTML = "";
    $("#search-bar-suggestions").classList.toggle("not-empty", false);
    this.classList.toggle("invisible", true);
    $("#header-burger-button").classList.toggle("invisible", true);
    $("#header-return-button").classList.toggle("invisible", false);
    $("#search-bar").querySelector("i").classList.toggle("invisible", true);
    $("#search-bar").querySelector("input").placeholder = "Search Anilist...";
    $("#search-bar").querySelector("input").value = "";
    current_view = "add_manga";
}