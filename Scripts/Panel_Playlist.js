// ==PREPROCESSOR==
// @name 'Playlist Panel'
// @author 'design: eXtremeHunter'
// @author 'everything else: TheQwertiest'
// ==/PREPROCESSOR==

var trace_call = false;
var trace_on_paint = false;
var trace_on_move = false;

// TODO: Test with no playlists
// TODO: implement track skipping on low rating
// TODO: consider making registration for on_key handlers
properties_v2.add_properties(
    {
        list_left_pad:   ['user.list.pad.left', 0],
        list_top_pad:    ['user.list.pad.top', 0],
        list_right_pad:  ['user.list.pad.right', 0],
        list_bottom_pad: ['user.list.pad.bottom', 0],

        show_scrollbar:      ['user.scrollbar.show', true],
        scrollbar_right_pad: ['user.scrollbar.pad.right', 0],
        scrollbar_w:         ['user.scrollbar.width', utils.GetSystemMetrics(2)],

        row_h:                  ['user.row.height', 20],
        rows_in_header:         ['user.header.normal.row_count', 4],
        rows_in_compact_header: ['user.header.compact.row_count', 2],

        show_playlist_info: ['user.playlist_info.show', true],

        show_header:        ['user.header.show', true],
        use_compact_header: ['user.header.use_compact', false],
        show_album_art:     ['user.header.this.art.show', true],
        auto_album_art:     ['user.header.this.art.auto', false],
        show_group_info:    ['user.header.info.show', true],

        alternate_row_color: ['user.row.alternate_color', true],
        show_playcount:      ['user.row.play_count.show', _.cc('foo_playcount')],
        show_rating:         ['user.row.rating.show', _.cc('foo_playcount')],
        show_focused_row:    ['user.row.focused.show', true],
        show_queue_position: ['user.row.queue_position.show', true],

        auto_colapse:                ['user.header.collapse.auto', false],
        collapse_on_playlist_switch: ['user.header.collapse.on_playlist_switched', false],
        collapse_on_start:           ['user.header.collapse.on_start', false],

        user_group_query: ['user.header.group.user_defined_query', ''],

        skipLessThan: ['user.playback.skip.min_rating', 2],
        enableSkip:   ['user.playback.skip', false],
        useTagRating: ['user.playback.rating_from_tags', false],

        group_query:    ['system.header.group.query', '%album artist%%album%%discnumber%'],
        group_query_id: ['system.header.group.id', 3],

        scroll_pos: ['system.scrollbar.position', 0],

        is_selection_dynamic: ['system.selection.dynamic', true]
    }
);

var g_component_playcount = _.cc('foo_playcount');
var g_component_utils = _.cc('foo_utils');

if (properties_v2.rows_in_header.get() < 0) {
    properties_v2.rows_in_header.set(0);
}
if (properties_v2.rows_in_compact_header.get() < 0) {
    properties_v2.rows_in_compact_header.set(0);
}
var g_min_row_h = 10;
if (properties_v2.row_h.get() < g_min_row_h) {
    properties_v2.row_h.set(g_min_row_h);
}
if (properties_v2.group_query_id.get() === 5) {
    properties_v2.group_query.set(properties_v2.user_group_query.get());
}
if (properties_v2.show_rating.get() && !g_component_playcount) {
    properties_v2.show_rating.set(false);
}
if (properties_v2.show_playcount.get() && !g_component_playcount) {
    properties_v2.show_playcount.set(false);
}

// Evaluators
var g_group_queries = {
    'artist':            '%album artist%',
    'artist_album':      '%album artist%%album%',
    'artist_album_disc': '%album artist%%album%%discnumber%',
    'artist_path':       '$directory_path(%path%)',
    'artist_date':       '%date%',
    'user_defined':      properties_v2.user_group_query.get()
};

//---> Fonts
var pl_fonts = {
    title_normal:   gdi.font('Segoe Ui', 12, 0),
    title_selected: gdi.font('Segoe Ui Semibold', 12, 0),
    title_playing:  gdi.font('Segoe Ui Semibold', 12, 0),

    artist_normal:          gdi.font('Segoe Ui Semibold', 18, 0),
    artist_playing:         gdi.font('Segoe Ui Semibold', 18, 0 | 4),
    artist_normal_compact:  gdi.font('Segoe Ui Semibold', 15, 0),
    artist_playing_compact: gdi.font('Segoe Ui Semibold', 15, 0 | 4),

    playcount:      gdi.font('Segoe Ui', 9, 0),
    album:          gdi.font('Segoe Ui Semibold', 15, 0),
    date:           gdi.font('Segoe UI Semibold', 16, 1),
    date_compact:   gdi.font('Segoe UI Semibold', 15, 0),
    info:           gdi.font('Segoe Ui', 11, 0),
    cover:          gdi.font('Segoe Ui Semibold', 11, 0),
    rating_not_set: gdi.font('Segoe Ui Symbol', 14),
    rating_set:     gdi.font('Segoe Ui Symbol', 16)
};

var pl_colors = {};
//---> Common
pl_colors.background = panelsBackColor;
//---> Group Colors
pl_colors.group_title = _.RGB(180, 182, 184);
pl_colors.group_title_selected = pl_colors.group_title;
pl_colors.artist_normal = pl_colors.group_title;
pl_colors.artist_playing = pl_colors.artist_normal;
pl_colors.album_normal = _.RGB(130, 132, 134);
pl_colors.album_playing = pl_colors.album_normal;
pl_colors.info_normal = _.RGB(130, 132, 134);
pl_colors.info_playing = pl_colors.info_normal;
pl_colors.date_normal = _.RGB(130, 132, 134);
pl_colors.date_playing = pl_colors.date_normal;
pl_colors.line_normal = panelsLineColor;
pl_colors.line_playing = pl_colors.line_normal;
pl_colors.line_selected = panelsLineColorSelected;
//---> Item Colors
pl_colors.title_selected = _.RGB(160, 162, 164);
pl_colors.title_playing = _.RGB(255, 165, 0);
pl_colors.title_normal = panelsNormalTextColor;
pl_colors.count_normal = _.RGB(120, 122, 124);
pl_colors.count_selected = pl_colors.title_selected;
pl_colors.count_playing = pl_colors.title_playing;
//---> Row Colors
pl_colors.row_selected = _.RGB(35, 35, 35);
pl_colors.row_alternate = _.RGB(35, 35, 35);
pl_colors.row_focus_selected = panelsLineColorSelected;
pl_colors.row_focus_normal = _.RGB(80, 80, 80);
pl_colors.row_queued = _.RGBA(150, 150, 150, 0);

//--->

var playlist = new Playlist(0, 0);

function on_paint(gr) {
    trace_call && trace_on_paint && fb.trace(qwr_utils.function_name());

    playlist.on_paint(gr);
}

function on_size() {
    trace_call && fb.trace(qwr_utils.function_name());

    var ww = window.Width;
    var wh = window.Height;

    if (ww <= 0 || wh <= 0) {
        // on_paint won't be called with such dimensions anyway
        return;
    }

    playlist.on_size(ww, wh);
}

function on_mouse_move(x, y, m) {
    trace_call && trace_on_move && fb.trace(qwr_utils.function_name());

    qwr_utils.DisableSizing(m);

    playlist.on_mouse_move(x, y, m);
}

function on_mouse_lbtn_down(x, y, m) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_mouse_lbtn_down(x, y, m);
}

function on_mouse_lbtn_dblclk(x, y, m) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_mouse_lbtn_dblclk(x, y, m);
}

function on_mouse_lbtn_up(x, y, m) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_mouse_lbtn_up(x, y, m);

    qwr_utils.EnableSizing(m);
}

function on_mouse_rbtn_down(x, y, m) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_mouse_rbtn_down(x, y, m);
}

function on_mouse_rbtn_up(x, y, m) {
    trace_call && fb.trace(qwr_utils.function_name());

    return playlist.on_mouse_rbtn_up(x, y, m);
}

function on_mouse_wheel(delta) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_mouse_wheel(delta);
}

function on_mouse_leave() {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_mouse_leave();
}

function on_key_down(vkey) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_key_down(vkey);
}

function on_key_up(vkey) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_key_up(vkey);
}

function on_drag_enter(action, x, y, mask) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_drag_enter(action, x, y, mask);
}

function on_drag_leave() {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_drag_leave();
}

function on_drag_drop(action, x, y, mask) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_drag_drop(action, x, y, mask);
}

function on_drag_over(action, x, y, mask) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_drag_over(action, x, y, mask);
}

function on_item_focus_change(playlist_arg, from, to) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_item_focus_change(playlist_arg, from, to);
}

function on_playlists_changed() {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_playlists_changed();
}

function on_playlist_switch() {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_playlist_switch();
}

function on_playlist_items_reordered(playlistIndex) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_playlist_items_reordered(playlistIndex);
}

function on_playlist_items_removed(playlistIndex) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_playlist_modified(playlistIndex);
}

function on_playlist_items_added(playlistIndex) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_playlist_items_added(playlistIndex);
}

function on_playlist_items_selection_change() {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_playlist_items_selection_change();
}

function on_playback_new_track(metadb) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_playback_new_track(metadb);
}

function on_playback_queue_changed(origin) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_playback_queue_changed(origin);
}

function on_playback_stop(reason) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_playback_stop(reason);
}

function on_focus(is_focused) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_focus(is_focused);
}

function on_metadb_changed(handles, fromhook) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_metadb_changed(handles, fromhook);
}

function on_get_album_art_done(metadb, art_id, image, image_path) {
    trace_call && fb.trace(qwr_utils.function_name());

    playlist.on_get_album_art_done(metadb, art_id, image, image_path);
}

function Playlist(x, y) {
    //public:

    /// callbacks
    this.on_paint = function (gr) {
        gr.FillSolidRect(this.x, this.y, this.w, this.h, pl_colors.background);
        gr.SetTextRenderingHint(TextRenderingHint.ClearTypeGridFit);

        if (items_to_draw.length) {
            _.forEachRight(items_to_draw, function (item) {
                item.draw(gr);
            });
        }
        else {
            var text = 'Drag some tracks here';

            if (plman.PlaylistCount) {
                text = 'Playlist: ' + plman.GetPlaylistName(cur_playlist_idx) + '\n<--- Empty --->';
            }

            gr.DrawString(text, gdi.font('Segoe Ui', 16, 0), _.RGB(80, 80, 80), this.x, this.y, this.w, this.h, StringFormat(1, 1));
        }

        if (is_scrollbar_available) {
            if (!scrollbar.is_scrolled_up) {
                gr.FillGradRect(list_x, list_y - 1, list_w, 7 + 1, 270, _.RGBtoRGBA(panelsBackColor, 0), _.RGBtoRGBA(panelsBackColor, 200));
            }
            if (!scrollbar.is_scrolled_down) {
                gr.FillGradRect(list_x, list_y + list_h - 8, list_w, 7 + 1, 90, _.RGBtoRGBA(panelsBackColor, 0), _.RGBtoRGBA(panelsBackColor, 200));
            }
        }

        if (is_scrollbar_visible) {
            scrollbar.paint(gr);
        }

        if (properties_v2.show_playlist_info.get()) {
            gr.FillSolidRect(0, playlist_info.y + playlist_info.h, this.w, 2, pssBackColor);
            playlist_info.on_paint(gr);
        }
    };

    this.on_size = function (w, h) {
        var w_changed = this.w !== w;
        var h_changed = this.h !== h;

        if (h_changed) {
            on_h_size(h);
        }

        if (w_changed) {
            on_w_size(w)
        }

        was_on_size_called = true;
    };

    this.on_mouse_move = function (x, y, m) {
        if (is_scrollbar_visible) {
            scrollbar.move(x, y, m);

            if (scrollbar.b_is_dragging || scrollbar.trace(x, y)) {
                return;
            }
        }

        if (!this.trace(x, y)) {
            mouse_in = false;
            return;
        }

        mouse_in = true;

        if (mouse_down && this.trace_list(x, y)) {
            if (!selection_handler.is_dragging()) {
                var item = get_item_under_mouse(x, y);
                if (item && last_hover_item && item !== last_hover_item) {
                    selection_handler.enable_drag();
                }
            }

            if (selection_handler.is_dragging()) {
                var drop_info = get_drop_row_info(x, y);
                var item = drop_info.item;

                if (drag_scroll_in_progress) {
                    if (!item || item === last_hover_item || (y >= (list_y + row_h * 2) && y <= (list_y + list_h - row_h * 2))) {
                        stop_drag_scroll();
                    }
                }
                else if (item) {
                    collapse_handler.expand(headers[item.header_idx]);
                    if (collapse_handler.changed) {
                        this.repaint();
                    }

                    selection_handler.drag(item, drop_info.is_above);

                    if (is_scrollbar_available) {
                        if (y < (list_y + row_h * 2) && !scrollbar.is_scrolled_up) {
                            selection_handler.drag(null, null);
                            start_drag_scroll('up');
                        }
                        if (y > (list_y + list_h - row_h) && !scrollbar.is_scrolled_down) {
                            selection_handler.drag(null, null);
                            start_drag_scroll('down');
                        }
                    }
                }
            }

            last_hover_item = get_item_under_mouse(x, y);
        }
    };

    this.on_mouse_lbtn_down = function (x, y, m) {
        mouse_down = true;
        if (mouse_double_clicked) {
            return;
        }

        if (is_scrollbar_visible) {
            if (scrollbar.trace(x, y)) {
                scrollbar.lbtn_dn(x, y, m);
                return;
            }
        }

        var ctrl_pressed = utils.IsKeyPressed(VK_CONTROL);
        var shift_pressed = utils.IsKeyPressed(VK_SHIFT);
        var item = this.trace_list(x, y) ? get_item_under_mouse(x, y) : undefined;
        last_hover_item = item;

        // TODO: consider moving to selection_handler
        if (item) {
            if (ctrl_pressed && shift_pressed && item.type === 'Header') {
                collapse_handler.toggle_collapse(item);
                mouse_down = false;
            }
            else if (item.is_selected_dynamic() && !ctrl_pressed && !shift_pressed) {
                mouse_on_item = true;
            }
            else {
                selection_handler.update_selection(get_item_under_mouse(x, y), ctrl_pressed, shift_pressed);
                selection_handler.sync_items_with_selection();
            }
        }
        else {
            selection_handler.clear_selection();
            selection_handler.sync_items_with_selection();
        }

        if (properties_v2.show_playlist_info.get() && playlist_info.trace(x, y)) {
            playlist_info.on_mouse_lbtn_down(x, y, m);
            mouse_down = false;
        }

        this.repaint();
    };

    this.on_mouse_lbtn_dblclk = function (x, y, m) {
        mouse_down = true;
        mouse_double_clicked = true;

        if (is_scrollbar_visible) {
            if (scrollbar.trace(x, y)) {
                scrollbar.lbtn_dn(x, y, m);
                return;
            }
        }

        var item = get_item_under_mouse(x, y);
        if (!item) {
            return;
        }

        if (item.type === 'Header') {
            plman.ExecutePlaylistDefaultAction(cur_playlist_idx, item.rows[0].idx);
        }
        else {
            if (properties_v2.show_rating.get() && item.rating_trace(x, y)) {
                item.rating_click(x, y);
                item.repaint();
            }
            else {
                plman.ExecutePlaylistDefaultAction(cur_playlist_idx, item.idx);
            }
        }
    };

    this.on_mouse_lbtn_up = function (x, y, m) {
        if (!mouse_down) {
            return;
        }

        var was_double_clicked = mouse_double_clicked;
        mouse_double_clicked = false;
        mouse_down = false;

        if (is_scrollbar_visible) {
            var wasDragging = scrollbar.b_is_dragging;
            scrollbar.lbtn_up(x, y, m);
            if (wasDragging) {
                return;
            }
        }

        if (was_double_clicked){
            return;
        }

        last_hover_item = undefined;

        // TODO: handle drop when mouse gets above or below list;
        if (selection_handler.is_dragging()) {
            stop_drag_scroll();

            if (this.trace_list(x, y) && selection_handler.can_drop()) {
                plman.UndoBackup(cur_playlist_idx);
                selection_handler.drop();
            }
            else {
                selection_handler.disable_drag();
            }
        }
        else if (mouse_on_item) {
            var ctrl_pressed = utils.IsKeyPressed(VK_CONTROL);
            var shift_pressed = utils.IsKeyPressed(VK_SHIFT);
            var item = get_item_under_mouse(x, y);
            // TODO: consider moving to selection_handler
            if (item) {
                selection_handler.update_selection(get_item_under_mouse(x, y), ctrl_pressed, shift_pressed);
                selection_handler.sync_items_with_selection();
            }
        }

        mouse_on_item = false;
        this.repaint();
    };

    this.on_mouse_rbtn_down = function (x, y, m) {
        if (!rows.length) {
            return;
        }

        if (is_scrollbar_visible && scrollbar.trace(x, y)) {
            return;
        }

        var item = this.trace_list(x, y) ? get_item_under_mouse(x, y) : undefined;
        if (!item) {
            selection_handler.clear_selection();
            selection_handler.sync_items_with_selection();
            return;
        }

        if (!item.is_selected_dynamic()) {
            selection_handler.clear_selection();
            selection_handler.update_selection(item);
            selection_handler.sync_items_with_selection();
        }

        this.repaint();
    };

    this.on_mouse_rbtn_up = function (x, y, m) {
        if (is_scrollbar_visible && scrollbar.trace(x, y)) {
            return scrollbar.rbtn_up(x, y);
        }

        if (properties_v2.show_playlist_info.get() && playlist_info.trace(x, y)) {
            return playlist_info.on_mouse_rbtn_up(x, y, m);
        }

        var metadb = utils.IsKeyPressed(VK_CONTROL) ? (fb.IsPlaying ? fb.GetNowPlaying() : fb.GetFocusItem()) : fb.GetFocusItem();

        var has_selected_item = selection_handler.has_selected_items();
        var has_multiple_selected_items = selection_handler.selected_items_count() > 1;
        var is_queue_active = plman.IsPlaybackQueueActive();
        var is_auto_playlist = plman.IsAutoPlaylist(cur_playlist_idx);
        var playlist_count = plman.PlaylistCount;
        var sendToPlaylistId = 0;

        var cpm = window.CreatePopupMenu();
        var web = window.CreatePopupMenu();
        var ce = window.CreatePopupMenu();
        var ccmm = fb.CreateContextMenuManager();
        var appear = window.CreatePopupMenu();
        var appear_row = window.CreatePopupMenu();
        var appear_header = window.CreatePopupMenu();
        var sort = window.CreatePopupMenu();
        var lists = window.CreatePopupMenu();
        var send = window.CreatePopupMenu();
        var skip = window.CreatePopupMenu();
        var art = window.CreatePopupMenu();
        var group = window.CreatePopupMenu();

        var is_cur_playlist_empty = !rows.length;

        plman.SetActivePlaylistContext();

        if (fb.IsPlaying) {
            cpm.AppendMenuItem(MF_STRING, 5, 'Show now playing');
        }

        if (!is_cur_playlist_empty) {
            cpm.AppendMenuItem(MF_STRING, 6, 'Refresh playlist \tF5');
            cpm.AppendMenuItem(MF_STRING, 7, 'Select all \tCtrl+A');
            if (has_selected_item) {
                cpm.AppendMenuItem(is_auto_playlist ? MF_GRAYED : MF_STRING, 8, 'Remove from list \tDelete');
            }
            if (is_queue_active) {
                cpm.AppendMenuItem(MF_STRING, 9, 'Flush playback queue \tCtrl+Shift+Q');
            }
        }

        if (has_selected_item || copy_paste_metadb_list && copy_paste_metadb_list.Count > 0) {
            cpm.AppendMenuSeparator();

            if (has_selected_item) {
                cpm.AppendMenuItem(has_selected_item ? MF_STRING : MF_GRAYED, 10, 'Cut \tCtrl+X');
                cpm.AppendMenuItem(has_selected_item ? MF_STRING : MF_GRAYED, 11, 'Copy \tCtrl+C');
            }
            if (copy_paste_metadb_list && copy_paste_metadb_list.Count > 0) {
                cpm.AppendMenuItem((copy_paste_metadb_list && copy_paste_metadb_list.Count > 0) ? MF_STRING : MF_GRAYED, 12, 'Paste \tCtrl+V');
            }
        }

        if (!is_cur_playlist_empty) {
            cpm.AppendMenuSeparator();
            // -------------------------------------------------------------- //
            //---> Collapse/Expand

            ce.AppendMenuItem(MF_STRING, 20, 'Collapse all');
            if (plman.ActivePlaylist === plman.PlayingPlaylist) {
                ce.AppendMenuItem(MF_STRING, 21, 'Collapse all but now playing');
            }
            ce.AppendMenuItem(MF_STRING, 22, 'Expand all');
            ce.AppendMenuSeparator();
            ce.AppendMenuItem(MF_STRING, 23, 'Auto');
            ce.CheckMenuItem(23, properties_v2.auto_colapse.get());
            ce.AppendMenuItem(MF_STRING, 24, 'Collapse on start');
            ce.CheckMenuItem(24, properties_v2.collapse_on_start.get());
            ce.AppendTo(cpm, MF_STRING, 'Collapse/Expand');

            // -------------------------------------------------------------- //
            //---> Skip track

            skip.AppendMenuItem(MF_GRAYED, 25, 'Enable (Not yet implemented)');
            skip.CheckMenuItem(25, properties_v2.enableSkip.get());
            skip.AppendMenuSeparator();
            skip.AppendMenuItem(properties_v2.enableSkip.get() ? MF_STRING : MF_GRAYED, 26, 'Rated less than 2');
            skip.AppendMenuItem(properties_v2.enableSkip.get() ? MF_STRING : MF_GRAYED, 27, 'Rated less than 3');
            skip.AppendMenuItem(properties_v2.enableSkip.get() ? MF_STRING : MF_GRAYED, 28, 'Rated less than 4');
            skip.AppendMenuItem(properties_v2.enableSkip.get() ? MF_STRING : MF_GRAYED, 29, 'Rated less than 5');
            skip.AppendTo(cpm, MF_STRING, 'Skip');
            skip.CheckMenuRadioItem(26, 29, 24 + properties_v2.skipLessThan.get());
            // -------------------------------------------------------------- //
            //---> Appearance

            appear.AppendTo(cpm, MF_STRING, 'Appearance');
            appear.CheckMenuItem(37, properties_v2.show_scrollbar.get());
            appear.AppendMenuItem(MF_STRING, 39, 'Show playlist info');
            appear.CheckMenuItem(39, properties_v2.show_playlist_info.get());
            appear.AppendMenuItem(MF_STRING, 37, 'Show scrollbar');
            appear.CheckMenuItem(37, properties_v2.show_scrollbar.get());
            appear.AppendMenuItem(MF_STRING, 40, 'Show group header');
            appear.CheckMenuItem(40, properties_v2.show_header.get());
            if (properties_v2.show_header.get()) {
                appear_header.AppendTo(appear, MF_STRING, 'Headers');
                appear_header.AppendMenuItem(MF_STRING, 41, 'Use compact group header');
                appear_header.CheckMenuItem(41, properties_v2.use_compact_header.get());

                if (!properties_v2.use_compact_header.get()) {
                    appear_header.AppendMenuItem(MF_STRING, 31, 'Show group info');
                    appear_header.CheckMenuItem(31, properties_v2.show_group_info.get());

                    art.AppendTo(appear_header, MF_STRING, 'Album art');
                    art.AppendMenuItem(MF_STRING, 42, 'Show');
                    art.CheckMenuItem(42, properties_v2.show_album_art.get());
                    art.AppendMenuItem(properties_v2.show_album_art.get() ? MF_STRING : MF_GRAYED, 43, 'Auto');
                    art.CheckMenuItem(43, properties_v2.auto_album_art.get());
                }
            }
            appear_row.AppendTo(appear, MF_STRING, 'Rows');
            appear_row.AppendMenuItem(MF_STRING, 36, 'Alternate row color');
            appear_row.CheckMenuItem(36, properties_v2.alternate_row_color.get());
            appear_row.AppendMenuItem(MF_STRING, 34, 'Show focus item');
            appear_row.CheckMenuItem(34, properties_v2.show_focused_row.get());
            appear_row.AppendMenuItem(g_component_playcount ? MF_STRING : MF_GRAYED, 32, 'Show play count');
            appear_row.CheckMenuItem(32, properties_v2.show_playcount.get());
            appear_row.AppendMenuItem(MF_STRING, 35, 'Show queue position');
            appear_row.CheckMenuItem(35, properties_v2.show_queue_position.get());
            appear_row.AppendMenuItem(g_component_playcount ? MF_STRING : MF_GRAYED, 33, 'Show rating');
            appear_row.CheckMenuItem(33, properties_v2.show_rating.get());

            // -------------------------------------------------------------- //
            // Grouping
            group.AppendTo(cpm, MF_STRING, 'Grouping');
            group.AppendMenuItem(MF_STRING, 50, 'by artist');
            group.AppendMenuItem(MF_STRING, 51, 'by artist / album');
            group.AppendMenuItem(MF_STRING, 52, 'by artist / album / disc number');
            group.AppendMenuItem(MF_STRING, 53, 'by path');
            group.AppendMenuItem(MF_STRING, 54, 'by date');
            group.AppendMenuItem(MF_STRING, 55, 'by user defined');

            if (properties_v2.group_query_id.get() !== undefined) {
                group.CheckMenuRadioItem(50, 55, 50 + properties_v2.group_query_id.get());
            }
            // -------------------------------------------------------------- //
            // Selection

            //---> Sort
            sort.AppendMenuItem(MF_STRING, 60, 'Sort by...');
            sort.AppendMenuItem(MF_STRING, 61, 'Randomize');
            sort.AppendMenuItem(MF_STRING, 62, 'Reverse');
            sort.AppendMenuItem(MF_STRING, 63, 'Sort by album');
            sort.AppendMenuItem(MF_STRING, 64, 'Sort by artist');
            sort.AppendMenuItem(MF_STRING, 65, 'Sort by file path');
            sort.AppendMenuItem(MF_STRING, 66, 'Sort by title');
            sort.AppendMenuItem(MF_STRING, 67, 'Sort by track number');
            sort.AppendMenuItem(MF_STRING, 68, 'Sort by date');
            sort.AppendTo(cpm, is_auto_playlist ? MF_GRAYED : MF_STRING, has_multiple_selected_items ? 'Sort selection' : 'Sort');

            // -------------------------------------------------------------- //
            //---> Web links
            web.AppendMenuItem(MF_STRING, 80, 'Google');
            web.AppendMenuItem(MF_STRING, 81, 'Google Images');
            web.AppendMenuItem(MF_STRING, 82, 'eCover');
            web.AppendMenuItem(MF_STRING, 83, 'Wikipedia');
            web.AppendMenuItem(MF_STRING, 84, 'YouTube');
            web.AppendMenuItem(MF_STRING, 85, 'Last FM');
            web.AppendMenuItem(MF_STRING, 86, 'Discogs');
            web.AppendTo(cpm, safeMode ? MF_GRAYED : MF_STRING, 'Weblinks');
            // -------------------------------------------------------------- //
            //---> Send

            if (has_selected_item) {
                send.AppendMenuItem(MF_STRING, 100, 'To top');
                send.AppendMenuItem(MF_STRING, 101, 'To bottom');
                send.AppendMenuSeparator();
                send.AppendMenuItem(MF_STRING, 102, 'Create New Playlist \tCtrl+N');
                send.AppendMenuSeparator();
                sendToPlaylistId = 103;
                for (var i = 0; i < playlist_count; ++i) {
                    send.AppendMenuItem((plman.IsAutoPlaylist(i) || i === cur_playlist_idx) ? MF_GRAYED : MF_STRING,
                        sendToPlaylistId + i,
                        plman.GetPlaylistName(i) + ' [' + plman.PlaylistItemCount(i) + ']' + (plman.IsAutoPlaylist(i) ? ' (Auto)' : '') + (i === plman.PlayingPlaylist ? ' (Now Playing)' : ''));
                }
                send.AppendTo(cpm, MF_STRING, 'Send selection');
            }
        }

        // -------------------------------------------------------------- //
        //---> Context Menu Manager
        if (has_selected_item) {
            cpm.AppendMenuSeparator();
            ccmm.InitContext(plman.GetPlaylistSelectedItems(cur_playlist_idx));
            ccmm.BuildMenu(cpm, 2000, -1);
        }

        // -------------------------------------------------------------- //
        //---> System
        if (utils.IsKeyPressed(VK_SHIFT)) {
            cpm.AppendMenuSeparator();
            _.appendDefaultContextMenu(cpm);
        }

        var id = cpm.TrackPopupMenu(x, y);

        if (has_selected_item) {
            ccmm.ExecuteByID(id - 2000);
        }

        // -------------------------------------------------------------- //
        switch (id) {
            case 5:
                show_now_playing();
                break;
            case 6:
                this.initialize_list();
                scroll_to_row(null, focused_item);
                break;
            case 7:
                selection_handler.select_all();
                selection_handler.sync_items_with_selection();
                break;
            case 8:
                plman.RemovePlaylistSelection(cur_playlist_idx);
                break;
            case 9:
                plman.FlushPlaybackQueue();
                break;
            case 10:
                copy_paste_metadb_list = selection_handler.cut();
                break;
            case 11:
                copy_paste_metadb_list = selection_handler.copy();
                break;
            case 12:
                selection_handler.paste(copy_paste_metadb_list);
                break;
            // -------------------------------------------------------------- //
            case 20:
                //---> Collapse/Expand
                collapse_handler.collapse_all();
                if (collapse_handler.changed) {
                    scroll_to_now_playing_or_focused();
                }
                break;
            case 21:
                collapse_handler.collapse_all_but_now_playing();
                if (collapse_handler.changed) {
                    scroll_to_now_playing_or_focused();
                }
                break;
            case 22:
                collapse_handler.expand_all();
                if (collapse_handler.changed) {
                    scroll_to_now_playing_or_focused();
                }
                break;
            case 23:
                properties_v2.auto_colapse.set(!properties_v2.auto_colapse.get());
                if (properties_v2.auto_colapse.get()) {
                    collapse_handler.collapse_all_but_now_playing();
                    if (collapse_handler.changed) {
                        scroll_to_now_playing_or_focused();
                    }
                }
                break;
            case 24:
                properties_v2.collapse_on_start.set(!properties_v2.collapse_on_start.get());
                break;
            // -------------------------------------------------------------- //
            case 25:
                properties_v2.enableSkip.set(!properties_v2.enableSkip.get());
                break;
            case 26:
                properties_v2.skipLessThan.set(2);
                break;
            case 27:
                properties_v2.skipLessThan.set(3);
                break;
            case 28:
                properties_v2.skipLessThan.set(4);
                break;
            case 29:
                properties_v2.skipLessThan.set(5);
                break;
            // -------------------------------------------------------------- //
            //---> Appearance
            case 31:
                properties_v2.show_group_info.set(!properties_v2.show_group_info.get());
                break;
            case 32:
                properties_v2.show_playcount.set(!properties_v2.show_playcount.get());
                break;
            case 33:
                properties_v2.show_rating.set(!properties_v2.show_rating.get());
                break;
            case 34:
                properties_v2.show_focused_row.set(!properties_v2.show_focused_row.get());
                break;
            case 35:
                properties_v2.show_queue_position.set(!properties_v2.show_queue_position.get());
                break;
            case 36:
                properties_v2.alternate_row_color.set(!properties_v2.alternate_row_color.get());
                break;
            case 37:
                properties_v2.show_scrollbar.set(!properties_v2.show_scrollbar.get());
                update_scrollbar();
                on_scrollbar_visibility_change();
                break;
            case 39:
                properties_v2.show_playlist_info.set(!properties_v2.show_playlist_info.get());
                update_list_h_size();
                break;
            case 40:
                properties_v2.show_header.set(!properties_v2.show_header.get());
                on_list_content_h_change();
                scroll_to_now_playing_or_focused();
                break;
            case 41:
                properties_v2.use_compact_header.set(!properties_v2.use_compact_header.get());
                header_h_in_rows = properties_v2.use_compact_header.get() ? properties_v2.rows_in_compact_header.get() : properties_v2.rows_in_header.get();
                this.initialize_list();
                break;
            case 42:
                properties_v2.show_album_art.set(!properties_v2.show_album_art.get());
                if (properties_v2.show_album_art.get()) {
                    get_album_art(items_to_draw);
                }
                break;
            case 43:
                properties_v2.auto_album_art.set(!properties_v2.auto_album_art.get());
                if (properties_v2.show_album_art.get()) {
                    get_album_art(items_to_draw);
                }
                break;
            // -------------------------------------------------------------- //
            // Grouping
            case 50:
                properties_v2.group_query.set(g_group_queries.artist);
                properties_v2.group_query_id.set(0);
                this.initialize_list();
                break;
            case 51:
                properties_v2.group_query.set(g_group_queries.artist_album);
                properties_v2.group_query_id.set(1);
                this.initialize_list();
                break;
            case 52:
                properties_v2.group_query.set(g_group_queries.artist_album_disc);
                properties_v2.group_query_id.set(2);
                this.initialize_list();
                break;
            case 53:
                properties_v2.group_query.set(g_group_queries.path);
                properties_v2.group_query_id.set(3);
                this.initialize_list();
                break;
            case 54:
                properties_v2.group_query.set(g_group_queries.date);
                properties_v2.group_query_id.set(4);
                this.initialize_list();
                break;
            case 55:
                properties_v2.group_query.set(g_group_queries.user_defined);
                properties_v2.group_query_id.set(5);
                this.initialize_list();
                break;
            // -------------------------------------------------------------- //
            case 60:
                //---> Sort
                if (has_multiple_selected_items) {
                    fb.RunMainMenuCommand('Edit/Selection/Sort/Sort by...');
                }
                else {
                    fb.RunMainMenuCommand('Edit/Sort/Sort by...');
                }
                break;
            case 61:
                plman.SortByFormat(cur_playlist_idx, '', has_multiple_selected_items);
                break;
            case 62:
                if (has_multiple_selected_items) {
                    fb.RunMainMenuCommand('Edit/Selection/Sort/Reverse');
                }
                else {
                    fb.RunMainMenuCommand('Edit/Sort/Reverse')
                }
                break;
            case 63:
                plman.SortByFormat(cur_playlist_idx, '%album%', has_multiple_selected_items);
                break;
            case 64:
                plman.SortByFormat(cur_playlist_idx, '%artist%', has_multiple_selected_items);
                break;
            case 65:
                plman.SortByFormat(cur_playlist_idx, '%path%%subsong%', has_multiple_selected_items);
                break;
            case 66:
                plman.SortByFormat(cur_playlist_idx, '%title%', has_multiple_selected_items);
                break;
            case 67:
                plman.SortByFormat(cur_playlist_idx, '%tracknumber%', has_multiple_selected_items);
                break;
            case 68:
                plman.SortByFormat(cur_playlist_idx, '%date%', has_multiple_selected_items);
                break;
            // -------------------------------------------------------------- //
            // Web links
            case 80:
                link('google', metadb);
                break;
            case 81:
                link('googleImages', metadb);
                break;
            case 82:
                link('eCover', metadb);
                break;
            case 83:
                link('wikipedia', metadb);
                break;
            case 84:
                link('youTube', metadb);
                break;
            case 85:
                link('lastFM', metadb);
                break;
            case 86:
                link('discogs', metadb);
                break;
            // -------------------------------------------------------------- //
            // Selection
            case 100: // Send to top
                plman.MovePlaylistSelection(cur_playlist_idx, -plman.GetPlaylistFocusItemIndex(cur_playlist_idx));
                break;
            case 101: // Send to bottom
                plman.MovePlaylistSelection(cur_playlist_idx, plman.PlaylistItemCount(cur_playlist_idx) - plman.GetPlaylistSelectedItems(cur_playlist_idx).Count);
                break;
            case 102:
                plman.CreatePlaylist(playlist_count, '');
                plman.InsertPlaylistItems(playlist_count, 0, plman.GetPlaylistSelectedItems(cur_playlist_idx), true);
                break;
            // -------------------------------------------------------------- //
            default:
                _.executeDefaultContextMenu(id, scriptFolder + 'Panel_Playlist.js');
        }

        for (var i = 0; i < plman.PlaylistCount; i++) {
            if (id === (sendToPlaylistId + i)) {
                plman.ClearPlaylistSelection(i);
                plman.InsertPlaylistItems(i, plman.PlaylistItemCount(i), plman.GetPlaylistSelectedItems(cur_playlist_idx), true);
            }
        }

        _.dispose(cpm, ccmm, web, ce, appear, sort, lists, send, art, group);

        this.repaint();
        return true;
    };

    this.on_mouse_wheel = function (delta) {
        if (is_scrollbar_available) {
            scrollbar.wheel(delta);
        }
    };

    this.on_mouse_leave = function () {
        if (is_scrollbar_available) {
            scrollbar.leave();
        }

        mouse_in = false;
    };

    this.on_drag_enter = function (action, x, y, mask) {
        mouse_in = true;
        mouse_down = true;
        selection_handler.enable_external_drag();
    };

    this.on_drag_leave = function () {
        if (selection_handler.is_dragging()) {
            stop_drag_scroll();
            selection_handler.disable_external_drag();
        }
        mouse_in = false;
        mouse_down = false;

        this.repaint();
    };

    this.on_drag_over = function (action, x, y, mask) {
        on_mouse_move(x, y, mask);
    };

    this.on_drag_drop = function (action, x, y, m) {
        if (!selection_handler.is_dragging()) {
            return;
        }

        mouse_down = false;
        stop_drag_scroll();

        if (!this.trace_list(x, y) || !selection_handler.can_drop()) {
            selection_handler.disable_external_drag();
            return;
        }

        selection_handler.prepare_drop_external();

        var idx;
        if (!plman.PlaylistCount) {
            idx = plman.CreatePlaylist(0, 'Default');
            plman.ActivePlaylist = 0;
        }
        else {
            plman.UndoBackup(cur_playlist_idx);
            plman.ClearPlaylistSelection(cur_playlist_idx);
            idx = cur_playlist_idx;
        }

        if (idx !== undefined) {
            action.ToPlaylist();
            action.Playlist = idx;
            action.ToSelect = true;
        }
    };

    this.on_key_down = function (vkey) {
        key_down = true;

        if (playlist_info.on_key_down()) {
            // No repaint in playlist_info.on_key_down needed
            return;
        }

        var ctrl_pressed = utils.IsKeyPressed(VK_CONTROL);
        var shift_pressed = utils.IsKeyPressed(VK_SHIFT);

        switch (vkey) {
            case VK_UP: {
                var header = headers[focused_item.header_idx];
                var new_focus_idx;
                if (header.is_collapsed) {
                    new_focus_idx = _.last(headers[Math.max(0, focused_item.header_idx - 1)].rows).idx;
                }
                else {
                    new_focus_idx = Math.max(0, focused_item.idx - 1);
                }

                if (new_focus_idx !== focused_item.idx) {
                    scroll_to_row(focused_item, rows[new_focus_idx]);
                    if (!shift_pressed) {
                        selection_handler.clear_selection();
                    }
                    plman.SetPlaylistFocusItem(cur_playlist_idx, new_focus_idx);
                    selection_handler.update_selection(rows[new_focus_idx], null, shift_pressed);
                    selection_handler.sync_items_with_selection();
                }

                break;
            }
            case VK_DOWN: {
                var header = headers[focused_item.header_idx];
                var new_focus_idx;
                if (header.is_collapsed) {
                    new_focus_idx = _.head(headers[Math.min(headers.length - 1, focused_item.header_idx + 1)].rows).idx;
                }
                else {
                    new_focus_idx = Math.min(rows.length - 1, focused_item.idx + 1);
                }

                if (new_focus_idx !== focused_item.idx) {
                    scroll_to_row(focused_item, rows[new_focus_idx]);
                    if (!shift_pressed) {
                        selection_handler.clear_selection();
                    }
                    plman.SetPlaylistFocusItem(cur_playlist_idx, new_focus_idx);
                    selection_handler.update_selection(rows[new_focus_idx], null, shift_pressed);
                    selection_handler.sync_items_with_selection();
                }

                break;
            }
            case VK_LEFT: {
                var header = headers[focused_item.header_idx];
                collapse_handler.collapse(header);

                break;
            }
            case VK_RIGHT: {
                var header = headers[focused_item.header_idx];
                collapse_handler.expand(header);
                if (collapse_handler.changed) {
                    var new_focus_item = _.head(header.rows);
                    scroll_to_row(focused_item, new_focus_item);

                    plman.SetPlaylistFocusItem(cur_playlist_idx, new_focus_item.idx);
                    selection_handler.update_selection(new_focus_item, null, null);
                    selection_handler.sync_items_with_selection();
                }

                break;
            }
            case VK_PRIOR: {
                var new_focus_item;
                if (is_scrollbar_available) {
                    new_focus_item = _.head(items_to_draw);
                    if (new_focus_item.type === 'Header') {
                        new_focus_item = rows[new_focus_item.rows[0].idx];
                    }
                    if (new_focus_item.y < list_y && new_focus_item.y + new_focus_item.h > list_y) {
                        new_focus_item = rows[new_focus_item.idx + 1];
                    }
                    if (new_focus_item.idx === focused_item.idx) {
                        scrollbar.shift_page(-1);

                        new_focus_item = _.head(items_to_draw);
                        if (new_focus_item.type === 'Header') {
                            new_focus_item = rows[new_focus_item.rows[0].idx];
                        }
                    }
                }
                else {
                    new_focus_item = _.head(items_to_draw);
                }

                if (new_focus_item.idx !== focused_item.idx) {
                    if (!shift_pressed) {
                        selection_handler.clear_selection();
                    }
                    plman.SetPlaylistFocusItem(cur_playlist_idx, new_focus_item.idx);
                    selection_handler.update_selection(new_focus_item, null, shift_pressed);
                    selection_handler.sync_items_with_selection();
                }

                break;
            }
            case VK_NEXT: {
                var new_focus_item;
                if (is_scrollbar_available) {
                    new_focus_item = _.last(items_to_draw);
                    if (new_focus_item.type === 'Header') {
                        new_focus_item = _.last(headers[new_focus_item.idx - 1].rows);
                    }
                    if (new_focus_item.y < list_y + list_h && new_focus_item.y + new_focus_item.h > list_y + list_h) {
                        new_focus_item = rows[new_focus_item.idx - 1];
                    }
                    if (new_focus_item.idx === focused_item.idx) {
                        scrollbar.shift_page(1);

                        new_focus_item = _.last(items_to_draw);
                        if (new_focus_item.type === 'Header') {
                            new_focus_item = _.last(headers[new_focus_item.idx - 1].rows);
                        }
                    }
                }
                else {
                    new_focus_item = _.last(items_to_draw);
                }

                if (new_focus_item.idx !== focused_item.idx) {
                    if (!shift_pressed) {
                        selection_handler.clear_selection();
                    }
                    plman.SetPlaylistFocusItem(cur_playlist_idx, new_focus_item.idx);
                    selection_handler.update_selection(new_focus_item, null, shift_pressed);
                    selection_handler.sync_items_with_selection();
                }

                break;
            }
            case VK_DELETE: {
                plman.UndoBackup(cur_playlist_idx);
                plman.RemovePlaylistSelection(cur_playlist_idx, false);

                break;
            }
            case VK_KEY_A: {
                if (ctrl_pressed) {
                    selection_handler.select_all();
                    selection_handler.sync_items_with_selection();
                }

                break;
            }
            case VK_KEY_F: {
                if (ctrl_pressed) {
                    fb.RunMainMenuCommand('Edit/Search');
                }
                else if (shift_pressed) {
                    fb.RunMainMenuCommand('Library/Search');
                }

                break;
            }
            case VK_RETURN: {
                plman.ExecutePlaylistDefaultAction(cur_playlist_idx, focused_item.idx);

                break;
            }
            case VK_HOME: {
                if (focused_item.idx === 0 && scrollbar.is_scrolled_up) {
                    return;
                }

                if (!shift_pressed) {
                    selection_handler.clear_selection();
                    selection_handler.sync_items_with_selection();
                }

                var new_focus_idx = 0;
                if (new_focus_idx !== focused_item.idx) {
                    plman.SetPlaylistFocusItem(cur_playlist_idx, new_focus_idx);
                    selection_handler.update_selection(rows[new_focus_idx], null, shift_pressed);
                    selection_handler.sync_items_with_selection();
                }

                break;
            }
            case VK_END: {
                if (focused_item.idx === _.last(rows).idx && scrollbar.is_scrolled_down) {
                    return;
                }

                if (!shift_pressed) {
                    selection_handler.clear_selection();
                    selection_handler.sync_items_with_selection();
                }

                if (is_scrollbar_available) {
                    scrollbar.scroll_to_end();
                }

                var new_focus_idx = _.last(rows).idx;
                if (new_focus_idx !== focused_item.idx) {
                    plman.SetPlaylistFocusItem(cur_playlist_idx, new_focus_idx);
                    selection_handler.update_selection(rows[new_focus_idx], null, shift_pressed);
                    selection_handler.sync_items_with_selection();
                }

                break;
            }
            case VK_KEY_N: {
                if (ctrl_pressed) {
                    plman.CreatePlaylist(plman.PlaylistCount, '');
                    plman.ActivePlaylist = plman.PlaylistCount - 1;
                }
                break;
            }
            case VK_KEY_O: {
                if (shift_pressed) {
                    fb.RunContextCommandWithMetadb('Open Containing Folder', focused_item);
                }
                break;
            }
            case VK_KEY_M: {
                if (ctrl_pressed) {
                    fb.RunMainMenuCommand('View/Playlist Manager');
                }
                break;
            }
            case VK_KEY_Q: {
                if (ctrl_pressed && shift_pressed) {
                    plman.FlushPlaybackQueue();
                    break;
                }

                if (ctrl_pressed) {
                    plman.AddPlaylistItemToPlaybackQueue(cur_playlist_idx, focused_item.idx);

                }
                else if (shift_pressed) {
                    var queue_idx = plman.FindPlaybackQueueItemIndex(fb.GetFocusItem(), cur_playlist_idx, focused_item.idx);
                    plman.RemoveItemFromPlaybackQueue(queue_idx);

                }
                break;
            }
            case VK_F5: {
                this.initialize_list();
                break;
            }
            case VK_KEY_C: {
                if (ctrl_pressed) {
                    copy_paste_metadb_list = selection_handler.copy();
                }
                break;
            }
            case VK_KEY_X: {
                if (ctrl_pressed) {
                    copy_paste_metadb_list = selection_handler.cut();
                }
                break;
            }
            case VK_KEY_V: {
                if (ctrl_pressed) {
                    selection_handler.paste(copy_paste_metadb_list);
                }
                break;
            }
        }
        this.repaint();
    };

    this.on_key_up = function (vkey) {
        key_down = false;
    };

    this.on_item_focus_change = function (playlist_idx, from_idx, to_idx) {
        if (playlist_idx !== cur_playlist_idx || focused_item && focused_item.idx === to_idx) {
            return;
        }

        if (focused_item) {
            focused_item.is_focused = false;
        }

        if (to_idx === -1) {
            focused_item = undefined;
        }
        else if (rows.length) {
            to_idx = Math.min(to_idx, rows.length - 1);
            focused_item = rows[to_idx];
            focused_item.is_focused = true;
        }

        if (!is_in_focus && focused_item) {
            // For selection from outside
            var from_row = from_idx === -1 ? null : rows[from_idx];
            scroll_to_row(from_row, focused_item);
        }

        this.repaint();
    };

    this.on_playlist_switch = function () {
        if (cur_playlist_idx !== plman.ActivePlaylist) {
            scroll_pos = 0;
            properties_v2.scroll_pos.set(0);
        }

        if (properties_v2.show_playlist_info.get()) {
            playlist_info.on_playlist_modified();
        }

        this.initialize_list();
        this.repaint();
    };

    this.on_playlist_items_added = function (playlist_idx) {
        if (playlist_idx !== cur_playlist_idx) {
            return;
        }

        if (selection_handler.is_external_drop()) {
            selection_handler.drop_external();
        }
        else {
            this.on_playlist_modified(playlist_idx)
        }
    };

    this.on_playlist_items_reordered = function (playlist_idx) {
        if (playlist_idx !== cur_playlist_idx) {
            return;
        }

        this.initialize_list();
        if (focused_item) {
            scroll_to_row(null, focused_item);
        }
        this.repaint();
    };

    this.on_playlist_modified = function (playlist_idx) {
        if (playlist_idx !== cur_playlist_idx) {
            return;
        }

        if (properties_v2.show_playlist_info.get()) {
            playlist_info.on_playlist_modified();
        }

        this.initialize_list();
        this.repaint();
    };

    this.on_playlists_changed = function () {
        if (plman.ActivePlaylist > plman.PlaylistCount
            || plman.ActivePlaylist === (-1 >>> 0)
            || plman.ActivePlaylist === -1) {
            plman.ActivePlaylist = plman.PlaylistCount - 1;
        }
    };

    this.on_playlist_items_selection_change = function () {
        if (!mouse_in && !key_down) {
            selection_handler.initialize_selection();
        }

        if (properties_v2.show_playlist_info.get()) {
            playlist_info.on_playlist_modified();
        }
    };

    this.on_playback_new_track = function (metadb) {
        if (playing_item) {
            playing_item.is_playing = false;
            playing_item = undefined;
        }

        var playing_item_location = plman.GetPlayingItemLocation();
        if (playing_item_location.IsValid && playing_item_location.PlaylistIndex === cur_playlist_idx) {
            playing_item = rows[playing_item_location.PlaylistItemIndex];
            playing_item.is_playing = true;

            if (fb.CursorFollowPlayback) {
                selection_handler.update_selection(playing_item);
                selection_handler.sync_items_with_selection();

                if (properties_v2.auto_colapse.get()) {
                    collapse_handler.collapse_all_but_now_playing();
                }
                scroll_to_now_playing();
            }
        }

        this.repaint();
    };

    this.on_playback_queue_changed = function (origin) {
        intialize_rows_queue();
        this.repaint();
    };

    this.on_playback_stop = function (reason) {
        if (playing_item) {
            playing_item.is_playing = false;
            playing_item.repaint();
        }
    };

    this.on_focus = function (is_focused) {
        if (focused_item) {
            focused_item.is_focused = is_focused;
            focused_item.repaint();
        }
        is_in_focus = is_focused;
    };

    this.on_metadb_changed = function (handles, fromhook) {
        if (properties_v2.show_playlist_info.get()) {
            playlist_info.on_playlist_modified();
        }

        rows.forEach(function (item) {
            item.reset_queried_data();
        });

        this.repaint();
    };

    this.on_get_album_art_done = function (metadb, art_id, image, image_path) {
        if (!image) {
            image = null;
        }

        items_to_draw.forEach( function (item) {
            if (item.type === 'Header' && !item.has_art() && item.rows[0].metadb.Compare(metadb)) {
                item.assign_art(image);
                item.repaint();
            }
        });
    };

    /// EOF callbacks

    this.trace = function (x, y) {
        return x >= this.x && x < this.x + this.w && y >= this.y && y < this.y + this.h;
    };

    this.trace_list = function (x, y) {
        return x >= list_x && x < list_x + list_w && y >= list_y && y < list_y + list_h;
    };

    var throttled_repaint = _.throttle(_.bind(function () {
        window.RepaintRect(this.x, this.y, this.w, this.h);
    }, this), 1000 / 60);
    this.repaint = function () {
        throttled_repaint();
    };

    // This method does not contain any redraw calls - it's purely back-end
    this.initialize_list = function () {
        trace_call && fb.trace('initialize_list');
        cur_playlist_idx = plman.ActivePlaylist;
        var playlist_size = plman.PlaylistItemCount(cur_playlist_idx);
        var playlist_items = plman.GetPlaylistItems(cur_playlist_idx);

        rows = [];
        for (var i = 0; i < playlist_size; ++i) {
            rows.push(new Row(list_x, 0, list_w, row_h, playlist_items.Item(i), i, cur_playlist_idx));
            if (!properties_v2.show_header.get()) {
                rows[i].is_odd = (i + 1) % 2;
            }
        }

        playing_item = undefined;
        var playing_item_location = plman.GetPlayingItemLocation();
        if (playing_item_location.IsValid && playing_item_location.PlaylistIndex === cur_playlist_idx) {
            playing_item = rows[playing_item_location.PlaylistItemIndex];
            playing_item.is_playing = true;
        }

        focused_item = undefined;
        var focus_item_idx = plman.GetPlaylistFocusItemIndex(cur_playlist_idx);
        if (focus_item_idx !== -1) {
            focused_item = rows[focus_item_idx];
            focused_item.is_focused = true;
        }

        create_headers();
        intialize_rows_queue();
        collapse_handler.initialize(headers);

        if (!was_on_size_called) {
            if (properties_v2.collapse_on_start.get()) {
                collapse_handler.collapse_all();
            }

            collapse_handler.set_callback(on_list_content_h_change);
            scroll_pos = properties_v2.scroll_pos.get();

            // TODO: add scroll to playing or selected (for script reinit)
        }
        else {
            on_list_content_h_change();
        }

        selection_handler = new SelectionHandler(rows, headers, cur_playlist_idx);
    };

    //private:
    function on_list_content_h_change() {
        update_scrollbar();
        on_scrollbar_visibility_change();
        on_drawn_content_change();
    }

    function on_drawn_content_change() {
        set_rows_boundary_status();
        calculate_shift_params();
        generate_items_to_draw();
        get_album_art(items_to_draw);
    }

    function initialize_scrollbar() {
        is_scrollbar_available = false;

        var scrollbar_x = that.x + that.w - properties_v2.scrollbar_w.get() - properties_v2.scrollbar_right_pad.get();
        // Consider moving to more suitable place
        var scrollbar_y = that.y + (properties_v2.show_playlist_info.get() ? (playlist_info.h + 2) : 0);
        var scrollbar_h = that.h - scrollbar_y - 3;

        if (scrollbar) {
            scrollbar.reset();
        }
        scrollbar = new _.scrollbar(scrollbar_x, scrollbar_y, properties_v2.scrollbar_w.get(), scrollbar_h, row_h, scrollbar_redraw_callback);
    }

    function update_scrollbar() {
        var total_height_in_rows = properties_v2.show_header.get() ? headers.length * header_h_in_rows : 0;
        headers.forEach(function (item) {
            if (!item.is_collapsed) {
                total_height_in_rows += item.rows.length;
            }
        });

        if (total_height_in_rows <= Math.ceil(rows_to_draw_precise)) {
            is_scrollbar_available = false;
            is_scrollbar_visible = false;
            scroll_pos = 0;
            return;
        }

        scrollbar.set_window_param(rows_to_draw_precise, total_height_in_rows);
        scrollbar.scroll_to(scroll_pos, true);

        scroll_pos = scrollbar.scroll;

        is_scrollbar_visible = properties_v2.show_scrollbar.get();
        is_scrollbar_available = true;
    }

    function on_h_size(h) {
        that.h = h;
        update_list_h_size();
    }

    function on_w_size(w) {
        that.w = w;
        playlist_info.set_w(that.w);
        update_list_w_size();
    }

    function on_scrollbar_visibility_change() {
        update_list_w_size();
    }

    function update_list_h_size() {
        list_y = that.y + properties_v2.list_top_pad.get();
        if (properties_v2.show_playlist_info.get()) {
            list_y += playlist_info.h + 2;
        }
        list_h = that.h - list_y - properties_v2.list_bottom_pad.get();

        rows_to_draw_precise = list_h / row_h;

        initialize_scrollbar();
        update_scrollbar();
        on_drawn_content_change();
    }

    function update_list_w_size() {
        list_w = that.w - properties_v2.list_left_pad.get() - properties_v2.list_right_pad.get();

        if (is_scrollbar_available) {
            if (is_scrollbar_visible) {
                list_w -= scrollbar.w + 2;
            }
            scrollbar.set_x(that.w - properties_v2.scrollbar_w.get() - properties_v2.scrollbar_right_pad.get());
        }

        headers.forEach(function (item) {
            item.set_w(list_w);
        });

        rows.forEach(function (item) {
            item.set_w(list_w);
        });
    }

    function create_headers() {
        var playlist_copy = rows;
        var head_nr = 0;
        headers = [];
        while (playlist_copy.length) {
            var header = new Header(list_x, 0, list_w, row_h * header_h_in_rows, head_nr);
            header.init_rows(playlist_copy);
            playlist_copy = _.drop(playlist_copy, header.rows.length);
            headers.push(header);
            ++head_nr;
        }
    }

    var debounced_get_album_art = _.debounce(function(items, force) {
        items.forEach(function (item) {
            if (item.type === 'Header' && (force || !item.has_art() ) ) {
                utils.GetAlbumArtAsync(window.ID, item.rows[0].metadb, g_album_art_id.front);
            }
        });
    }, 500, {
        'leading':  false,
        'trailing': true
    });

    function get_album_art(items, force) {
        if (!properties_v2.show_album_art.get()) {
            return;
        }

        debounced_get_album_art(items, force);
    }

    function scrollbar_redraw_callback() {
        scroll_pos = scrollbar.scroll;
        properties_v2.scroll_pos.set(scroll_pos);

        on_drawn_content_change();

        that.repaint();
    }

    function calculate_shift_params() {
        row_shift = Math.floor(scroll_pos);
        pixel_shift = -Math.round((scroll_pos - row_shift) * row_h);
    }

    function set_rows_boundary_status() {
        var last_row = _.last(rows);
        if (last_row) {
            last_row.is_cropped = is_scrollbar_available ? scrollbar.is_scrolled_down : false;
        }
    }

    // Called in three cases:
    // 1. Window vertical size changed
    // 2. Scroll position changed
    // 3. Playlist content changed
    function generate_items_to_draw() {
        items_to_draw = [];
        var start_y = list_y + pixel_shift;
        var cur_y = 0;
        var cur_row = 0;
        var first = true;

        _.forEach(headers, function (header) {

            if (properties_v2.show_header.get()) {
                if (cur_row + header_h_in_rows - 1 >= row_shift) {
                    if (first) {
                        header.y = start_y + (cur_row - row_shift) * row_h;
                        cur_y = header.y;
                        first = false;
                    }
                    else {
                        header.y = cur_y;
                    }
                    items_to_draw.push(header);
                    cur_y += header_h_in_rows * row_h;

                    if (cur_y >= that.h) {
                        return false;
                    }
                }

                cur_row += header_h_in_rows;

                if (header.is_collapsed) {
                    return true;
                }
            }

            var header_rows = header.rows;
            if (cur_row + header_rows.length - 1 >= row_shift) {
                for (var j = 0; j < header_rows.length; ++j) {
                    if (cur_row >= row_shift) {
                        if (first) {
                            header_rows[j].set_y(start_y + (cur_row - row_shift) * row_h);
                            cur_y = header_rows[j].y;
                            first = false;
                        }
                        else {
                            header_rows[j].set_y(cur_y);
                        }
                        items_to_draw.push(header_rows[j]);
                        cur_y += row_h;

                        if (cur_y >= that.h) {
                            return false;
                        }
                    }

                    ++cur_row;
                }
            }
            else {
                cur_row += header_rows.length;
            }
        });
    }

    function show_now_playing() {
        var playing_item_location = plman.GetPlayingItemLocation();
        if (!playing_item_location.IsValid) {
            return;
        }

        if (playing_item_location.PlaylistIndex !== cur_playlist_idx) {
            plman.ActivePlaylist = playing_item_location.PlaylistIndex;
            that.initialize_list();
        }
        else {
            collapse_handler.expand(headers[playing_item.header_idx]);
        }

        scroll_to_now_playing();
    }

    function scroll_to_now_playing_or_focused() {
        if (playing_item) {
            scroll_to_row(null, playing_item);
        }
        else if (focused_item) {
            scroll_to_row(null, focused_item);
        }
    }

    function scroll_to_now_playing() {
        if (!playing_item) {
            return;
        }

        scroll_to_row(null, playing_item);
    }

    function scroll_to_row(from_row, to_row) {
        if (!is_scrollbar_available) {
            return;
        }

        var from_header = from_row ? headers[from_row.header_idx] : undefined;
        var to_header = headers[to_row.header_idx];
        var is_from_header = from_header ? from_header.is_collapsed : false;
        var is_to_header = to_header.is_collapsed;

        var partial_shift_in_rows = 0;

        var visibility_state = {
            'not':            0,
            'partial_top':    1,
            'partial_bottom': 2,
            'full':           3
        };
        var playing_item_state = visibility_state['not'];
        _.forEach(items_to_draw, function (item) {
            if (is_to_header && item.type !== 'Header'
                || !is_to_header && item.type !== 'Row') {
                return true;
            }

            if (is_to_header && item.idx === to_header.idx
                || !is_to_header && item.idx === to_row.idx) {
                if (item.y < list_y && item.y + item.h > list_y) {
                    playing_item_state = visibility_state['partial_top'];
                    partial_shift_in_rows = is_to_header ? (list_y - item.y)/row_h : 0;
                }
                else if (item.y < list_y + list_h && item.y + item.h > list_y + list_h) {
                    playing_item_state = visibility_state['partial_bottom'];
                    partial_shift_in_rows = is_to_header ? (item.y + item.h - (list_y + list_h) )/row_h : 0;
                }
                else {
                    playing_item_state = visibility_state['full'];
                }
                return false;
            }
        });

        switch (playing_item_state) {
            case visibility_state['not']: {
                if (is_to_header) {
                    if (from_header && from_header.idx === to_header.idx - 1) {
                        scrollbar.scroll_to(scroll_pos + header_h_in_rows);
                    }
                    else if (from_header && from_header.idx === to_header.idx + 1) {
                        scrollbar.scroll_to(scroll_pos - header_h_in_rows);
                    }
                    else {
                        var item_idx = get_item_draw_row_idx(to_header);
                        var new_scroll_pos = Math.max(0, item_idx - Math.floor(rows_to_draw_precise / 2));
                        scrollbar.scroll_to(new_scroll_pos);
                    }
                }
                else if (from_row && from_row.idx === to_row.idx - 1) {
                    if (_.last(from_header.rows).idx === from_row.idx) {
                        scrollbar.scroll_to(scroll_pos + header_h_in_rows + 1);
                    }
                    else {
                        scrollbar.scroll_to(scroll_pos + 1);
                    }
                }
                else if (from_row && from_row.idx === to_row.idx + 1) {
                    if (_.head(from_header.rows).idx === to_row.idx) {
                        scrollbar.scroll_to(scroll_pos - header_h_in_rows - 1);
                    }
                    else {
                        scrollbar.scroll_to(scroll_pos - 1);
                    }
                }
                else {
                    var item_idx = get_item_draw_row_idx(to_row);
                    var new_scroll_pos = Math.max(0, item_idx - Math.floor(rows_to_draw_precise / 2));
                    scrollbar.scroll_to(new_scroll_pos);
                }

                break;
            }
            case visibility_state['partial_top']: {
                if (partial_shift_in_rows % row_h) {
                    scrollbar.shift_line(-1);
                }
                scrollbar.scroll_to(scroll_pos - Math.floor(partial_shift_in_rows));
                break;
            }
            case visibility_state['partial_bottom']: {
                if (partial_shift_in_rows % row_h) {
                    scrollbar.shift_line(1);
                }
                scrollbar.scroll_to(scroll_pos + Math.floor(partial_shift_in_rows));
                break;
            }
            case visibility_state['full']: {
                break;
            }
            default: {
                throw Error('Argument error:\nUnknown visibility state: ' + playing_item_state);
            }
        }
    }

    function intialize_rows_queue() {
        if (!properties_v2.show_queue_position.get()) {
            return
        }

        if (rows_queue.length) {
            clear_rows_queue();
        }

        var queue_contents = plman.GetPlaybackQueueContents().toArray();
        if (!queue_contents.length) {
            return;
        }

        queue_contents.forEach(function (item, i) {
            if (item.PlaylistIndex !== cur_playlist_idx) {
                return;
            }

            var cur_queue_item = rows[item.PlaylistItemIndex];
            var has_item = _.find(rows_queue, function (item) {
                return item.idx === cur_queue_item.idx;
            });

            if (!has_item) {
                cur_queue_item.queue_idx = i + 1;
                cur_queue_item.queue_idx_count = 1;
            }
            else {
                cur_queue_item.queue_idx_count++;
            }

            rows_queue.push(cur_queue_item);
        });
    }

    function clear_rows_queue() {
        if (!rows_queue.length) {
            return
        }

        rows_queue.forEach(function (item) {
            item.queue_idx = undefined;
            item.queue_idx_count = 0;
        });

        rows_queue = [];
    }

    function get_item_draw_row_idx(item) {
        var draw_row_idx = -1;
        var cur_row = 0;
        if (item.type === 'Header') {
            _.forEach(headers, function (header, i) {
                if (item.idx === i) {
                    draw_row_idx = cur_row;
                    return false;
                }

                cur_row += header_h_in_rows;
                if (!header.is_collapsed) {
                    cur_row += header.rows.length;
                }
            });
        }
        else {
            _.forEach(headers, function (header) {
                if (properties_v2.show_header.get()) {
                    cur_row += header_h_in_rows;
                    if (header.is_collapsed) {
                        return true;
                    }
                }

                _.forEach(header.rows, function (row) {
                    if (item.idx === row.idx) {
                        draw_row_idx = cur_row;
                        return false;
                    }
                    ++cur_row;
                });
                if (draw_row_idx !== -1) {
                    return false;
                }
            });
        }
        if (draw_row_idx === -1) {
            throw Error('Logic error:\nCould not find item in drawn item list');
        }
        return draw_row_idx;
    }

    function get_item_under_mouse(x, y) {
        var item = _.find(items_to_draw, function (item) {
            return item.trace(x, y);
        });

        return ( item === -1 ) ? undefined : item;
    }

    function get_drop_row_info(x, y) {
        var drop_info = {
            item:     undefined,
            is_above: undefined
        };

        var item = get_item_under_mouse(x, y);
        if (!item) {
            return drop_info;
        }

        var is_above = y < (item.y + item.h / 2);

        if (item.type === 'Header') {
            if (is_above) {
                if (item.idx === 0) {
                    drop_info.item = _.head(item.rows);
                    drop_info.is_above = true;
                }
                else {
                    drop_info.item = _.last(headers[item.idx - 1].rows);
                    drop_info.is_above = false;
                }
            }
            else {
                drop_info.item = _.head(item.rows);
                drop_info.is_above = true;
            }
        }
        else {
            if (is_above) {
                drop_info.item = item;
                drop_info.is_above = true;
            }
            else {
                if (properties_v2.show_header.get()
                    && item.idx === _.last(headers[item.header_idx].rows).idx) {
                    drop_info.item = item;
                    drop_info.is_above = false;
                }
                else {
                    drop_info.item = rows[item.idx + 1];
                    drop_info.is_above = true;
                }
            }
        }

        return drop_info;
    }

    function start_drag_scroll(key) {
        if (_.isNil(drag_scroll_timeout_timer)) {
            drag_scroll_timeout_timer = setTimeout(function () {
                drag_scroll_repeat_timer = setInterval(function () {
                    if (!scrollbar.in_sbar && !selection_handler.is_dragging) {
                        return;
                    }

                    drag_scroll_in_progress = true;

                    if (last_marked_item) {
                        last_marked_item.is_drop_top_selected = false;
                        last_marked_item.is_drop_bottom_selected = false;
                        last_marked_item.is_drop_boundary_reached = false;
                    }

                    var cur_marked_item;
                    if (key === 'up') {
                        scrollbar.shift_line(-1);

                        cur_marked_item = _.head(items_to_draw);
                        if (cur_marked_item.type === 'Header') {
                            collapse_handler.expand(cur_marked_item);
                            if (collapse_handler.changed) {
                                scrollbar.scroll_to(scroll_pos + cur_marked_item.rows.length);
                            }

                            cur_marked_item = _.head(cur_marked_item.rows);
                        }

                        last_marked_item = cur_marked_item;
                        last_marked_item.is_drop_top_selected = true;
                        last_marked_item.is_drop_boundary_reached = true;
                    }
                    else if (key === 'down') {
                        scrollbar.shift_line(1);

                        cur_marked_item = _.last(items_to_draw);
                        if (cur_marked_item.type === 'Header') {
                            collapse_handler.expand(cur_marked_item);
                            if (collapse_handler.changed) {
                                that.repaint();
                            }

                            cur_marked_item = _.last(headers[cur_marked_item.idx - 1].rows);
                        }

                        last_marked_item = cur_marked_item;
                        last_marked_item.is_drop_bottom_selected = true;
                        last_marked_item.is_drop_boundary_reached = true;
                    }
                    else {
                        throw Error('Argument error:\nUnknown drag scroll command: ' + key.toString());
                    }

                    if (last_marked_item) {
                        last_marked_item.repaint();
                    }

                    if (scrollbar.is_scrolled_down || scrollbar.is_scrolled_up) {
                        stop_drag_scroll();
                    }
                }, 50);
            }, 350);
        }
    }

    function stop_drag_scroll() {
        if (!_.isNil(drag_scroll_timeout_timer)) {
            clear_last_marked_item();
            clearTimeout(drag_scroll_timeout_timer);
        }
        if (!_.isNil(drag_scroll_repeat_timer)) {
            clear_last_marked_item();
            clearInterval(drag_scroll_repeat_timer);
        }

        drag_scroll_timeout_timer = undefined;
        drag_scroll_repeat_timer = undefined;

        drag_scroll_in_progress = false;
    }

    function clear_last_marked_item() {
        if (!_.isNil(last_marked_item)) {
            last_marked_item.is_drop_bottom_selected = false;
            last_marked_item.is_drop_top_selected = false;
            last_marked_item.is_drop_boundary_reached = false;
            last_marked_item.repaint();
        }
    }

    //public:
    this.x = x;
    this.y = y;
    this.w = 0;
    this.h = 0;

    //private:
    var that = this;

    // Constants
    var row_h = properties_v2.row_h.get();
    var header_h_in_rows = properties_v2.use_compact_header.get() ? properties_v2.rows_in_compact_header.get() : properties_v2.rows_in_header.get();

    // Window state
    var was_on_size_called = false;
    var rows_to_draw_precise = 0;

    var rows = [];
    var headers = [];
    var items_to_draw = [];

    var list_x = x + properties_v2.list_left_pad.get();
    var list_y = 0;
    var list_w = 0;
    var list_h = 0;

    var is_in_focus = false;

    // Playback state
    var cur_playlist_idx = undefined;
    var playing_item = undefined;
    var focused_item = undefined;
    var rows_queue = [];

    // Mouse and key state
    var mouse_in = false;
    var mouse_down = false;
    var mouse_double_clicked = false;
    var mouse_on_item = false;
    var key_down = false;

    // Item events
    var last_hover_item = undefined;
    var last_marked_item = undefined;

    // Timers
    var drag_scroll_in_progress = false;
    var drag_scroll_timeout_timer;
    var drag_scroll_repeat_timer;

    // Scrollbar props
    var scroll_pos = 0;
    var row_shift = 0;
    var pixel_shift = 0;
    var is_scrollbar_visible = properties_v2.show_scrollbar.get();
    var is_scrollbar_available = false;

    // copy, cut, paste data
    var copy_paste_metadb_list = fb.CreateHandleList();

    // Objects
    var selection_handler = undefined;
    var collapse_handler = new CollapseHandler();
    var playlist_info = new PlaylistInfo(0, 0, 0, 24);
    var scrollbar = undefined;

    // Workaround for bug: PlayingPlaylist is equal to -1 on startup
    if (plman.PlayingPlaylist === (-1 >>> 0)) {
        plman.PlayingPlaylist = plman.ActivePlaylist;
    }
    this.initialize_list();
}

function PlaylistInfo(x, y, w, h) {
    this.on_paint = function (gr) {
        if (!info_text) {
            var cur_playlist_idx = plman.ActivePlaylist;
            var metadb_list = plman.GetPlaylistSelectedItems(cur_playlist_idx);
            var is_selected = true;

            if (!metadb_list.Count) {
                metadb_list = plman.GetPlaylistItems(cur_playlist_idx);
                is_selected = false;
            }

            var track_count = metadb_list.Count;
            var tracks_text = "";
            var duration_text = "";
            if (track_count > 0) {
                tracks_text = track_count.toString() + (track_count > 1 ? ' tracks' : ' track');
                if (is_selected) {
                    tracks_text += ' selected';
                }

                var duration = metadb_list.CalcTotalDuration();
                if (duration) {
                    duration_text = utils.FormatDuration(duration);
                }
            }

            info_text = plman.GetPlaylistName(cur_playlist_idx);
            if (tracks_text) {
                info_text += ': ' + tracks_text;
            }
            if (duration_text) {
                info_text += ', ' + 'Length: ' + duration_text;
            }
        }

        gr.FillSolidRect(this.x, this.y, this.w, this.h, panelsFrontColor);
        gr.SetTextRenderingHint(TextRenderingHint.ClearTypeGridFit);

        if (plman.IsPlaylistLocked(plman.ActivePlaylist)) {
            // Position above scrollbar for eye candy
            var sbar_x = this.w - properties_v2.scrollbar_w.get() - properties_v2.scrollbar_right_pad.get();
            var lock_text = '\uF023';
            var lock_w = gr.MeasureString(lock_text, gdi.font('FontAwesome', 12, 0), 0, 0, 0, 0).Width;
            gr.DrawString(lock_text, gdi.font('FontAwesome', 12, 0), _.RGB(150, 152, 154), sbar_x + Math.round((properties_v2.scrollbar_w.get() - lock_w) / 2), 0, 8, this.h, StringFormat(1, 1));
        }

        gr.DrawString(info_text, pl_fonts.title_selected, _.RGB(150, 152, 154), 10, 0, this.w - 20, this.h - 2, StringFormat(1, 1, 3, 4096));
    };

    this.on_playlist_modified = function () {
        info_text = undefined;
        this.repaint();
    };

    this.on_mouse_lbtn_down = function (x, y, m) {
        if (!this.trace(x, y)) {
            return;
        }

        var cpm = window.CreatePopupMenu();

        var playlist_count = plman.PlaylistCount;
        var playlists_start_id = 4;

        cpm.AppendMenuItem(MF_STRING, 1, 'Playlist manager... \tCtrl+M');
        cpm.AppendMenuSeparator();
        if (g_component_utils) {
            cpm.AppendMenuItem(MF_STRING, 2, 'Lock Current Playlist');
            cpm.CheckMenuItem(2, plman.IsPlaylistLocked(plman.ActivePlaylist));
        }
        cpm.AppendMenuItem(MF_STRING, 3, 'Create New Playlist \tCtrl+N');
        cpm.AppendMenuSeparator();
        for (var i = 0; i < playlist_count; ++i) {
            cpm.AppendMenuItem(MF_STRING, playlists_start_id + i, plman.GetPlaylistName(i).replace(/&/g, '&&') + ' [' + plman.PlaylistItemCount(i) + ']' + (plman.IsAutoPlaylist(i) ? ' (Auto)' : "") + (i === plman.PlayingPlaylist ? ' \t(Now Playing)' : ""));
        }

        var id = cpm.TrackPopupMenu(x, y);
        switch (id) {
            case 1:
                fb.RunMainMenuCommand('View/Playlist Manager');
                break;
            case 2:
                fb.RunMainMenuCommand('Edit/Read-only');
                break;
            case 3:
                plman.CreatePlaylist(playlist_count, "");
                plman.ActivePlaylist = plman.PlaylistCount - 1;
                break;
        }

        var playlist_idx = id - playlists_start_id;
        if (playlist_idx < playlist_count && playlist_idx >= 0) {
            plman.ActivePlaylist = playlist_idx;
        }

        cpm.Dispose();
    };

    this.on_mouse_rbtn_up = function (x, y, m) {
        if (!this.trace(x, y)) {
            return true;
        }

        var cpm = window.CreatePopupMenu();
        if (utils.IsKeyPressed(VK_SHIFT)) {
            _.appendDefaultContextMenu(cpm);
        }

        var id = cpm.TrackPopupMenu(x, y);
        _.executeDefaultContextMenu(id, scriptFolder + 'Panel_Playlist.js');

        return true;
    };

    this.on_key_down = function (vkey) {
        var ctrl_pressed = utils.IsKeyPressed(VK_CONTROL);
        //var shift_pressed = utils.IsKeyPressed(VK_SHIFT);

        switch (vkey) {
            case VK_KEY_N: {
                if (ctrl_pressed) {
                    plman.CreatePlaylist(plman.PlaylistCount, '');
                    plman.ActivePlaylist = plman.PlaylistCount - 1;
                }
                break;
            }
            case VK_KEY_M: {
                if (ctrl_pressed) {
                    fb.RunMainMenuCommand('View/Playlist Manager');
                }
                break;
            }
            default: {
                return false;
            }
        }

        return true;
    };


    /// EOF callback

    this.set_w = function (w) {
        this.w = w;
    };

    this.trace = function (x, y) {
        return x >= this.x && x < this.x + this.w && y >= this.y && y < this.y + this.h;
    };

    var throttled_repaint = _.throttle(_.bind(function () {
        window.RepaintRect(this.x, this.y, this.w, this.h);
    }, this), 1000 / 60);
    this.repaint = function () {
        throttled_repaint();
    };

    //public:
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    //private:
    var info_text = undefined;
}

var azaz = 0

function Rating(x, y, w, h, metadb) {
    this.draw = function (gr, color) {
        for (var j = 0; j < 5; j++) {
            var cur_rating_x = this.x + j * btn_w;
            if (j < this.get_rating()) {
                gr.DrawString('\u2605', pl_fonts.rating_set, color, cur_rating_x, this.y - 1, btn_w, this.h, StringFormat(1, 1));
            }
            else {
                gr.DrawString('\u2219', pl_fonts.rating_not_set, color, cur_rating_x, this.y - 1, btn_w, this.h, StringFormat(1, 1));
            }
        }
    };

    this.trace = function (x, y) {
        return x >= this.x && x < this.x + this.w && y >= this.y && y < this.y + this.h;
    };

    this.click = function (x, y) {
        if (!this.trace(x, y)) {
            return;
        }

        var new_rating = Math.floor((x - this.x) / 14) + 1;
        var current_rating = this.get_rating();

        if (properties_v2.useTagRating.get()) {
            if (_.startsWith(_.tf('%path%', this.metadb), 'http')) {
                // TODO: replace with UpdateFileInfoFromJSON
                throw Error('Internal error:\nRating from tags is not yet implemented, sorry =(');
                // this.metadb.UpdateFileInfoSimple('RATING', (current_rating === new_rating) ? undefined : new_rating);
            }
        }
        else {
            fb.RunContextCommandWithMetadb((current_rating === new_rating) ? '<not set>' : ('Rating/' + new_rating), this.metadb);
        }

        rating = (current_rating === new_rating) ? 0 : new_rating;
    };

    this.get_rating = function () {
        if (_.isUndefined(rating)) {
            var current_rating;
            if (properties_v2.useTagRating.get()) {
                var fileInfo = this.metadb.GetFileInfo();
                current_rating = fileInfo.MetaValue(fileInfo.MetaFind('rating'), 0);
            }
            else {
                current_rating = _.tf('%rating%', this.metadb);
            }
            rating = _.toNumber(current_rating);
        }
        return rating;
    };

    this.reset_queried_data = function () {
        rating = undefined;
    };

    //const:
    var btn_w = 14;

    //public:
    this.metadb = metadb;

    this.x = x;
    this.y = y;
    this.w = btn_w * 5;
    this.h = h;

    //private:
    var rating = undefined;
}

function Row(x, y, w, h, metadb, idx, cur_playlist_idx_arg) {
    //public:
    this.draw = function (gr) {
        gr.FillSolidRect(this.x, this.y, this.w, this.h, pl_colors.background);

        if (this.is_odd && properties_v2.alternate_row_color.get()) {
            //gr.FillSolidRect(this.x, this.y, this.w, this.h - 1, pl_colors.row_alternate);
            gr.FillSolidRect(this.x, this.y + 1, this.w, this.h - 1, pl_colors.row_alternate);
        }

        var titleFont = pl_fonts.title_normal;
        var titleColor = pl_colors.title_normal;
        var countColor = pl_colors.count_normal;
        var rowColorFocus = pl_colors.row_focus_normal;
        var titleArtistColor = pl_colors.title_selected;

        if (this.is_selected_dynamic()) {
            if (properties_v2.alternate_row_color.get()) {
                //gr.DrawRect(this.x, this.y - 1, this.w - 1, this.h, 1, pl_colors.row_focus_selected);
                if (this.is_cropped) {
                    // last item is cropped
                    gr.DrawRect(this.x, this.y, this.w - 1, this.h - 1, 1, pl_colors.row_focus_selected);
                }
                else {
                    gr.DrawRect(this.x, this.y, this.w - 1, this.h, 1, pl_colors.row_focus_selected);
                }
            }
            else {
                gr.FillSolidRect(this.x, this.y, this.w, this.h, pl_colors.row_selected);
            }

            titleColor = pl_colors.title_selected;
            titleFont = pl_fonts.title_selected;
            countColor = pl_colors.count_selected;

            rowColorFocus = pl_colors.row_focus_selected;
            titleArtistColor = pl_colors.title_normal;
        }

        if (this.is_playing) {// Might override 'selected' fonts
            titleColor = pl_colors.title_playing;
            titleFont = pl_fonts.title_playing;
            countColor = pl_colors.count_playing;
        }

        //--->
        if (properties_v2.show_focused_row.get() && this.is_focused) {
            //gr.DrawRect(this.x + 1, this.y, this.w - 3, this.h - 2, 1, rowColorFocus);
            if (this.is_cropped) {
                // last item is cropped
                gr.DrawRect(this.x + 1, this.y + 1, this.w - 3, this.h - 3, 1, rowColorFocus);
            }
            else {
                gr.DrawRect(this.x + 1, this.y + 1, this.w - 3, this.h - 2, 1, rowColorFocus);
            }
        }

        if (this.is_drop_top_selected) {
            gr.DrawLine(this.x, this.y + 1, this.x + this.w, this.y + 1, 2, this.is_drop_boundary_reached ? _.RGB(255, 165, 0) : _.RGB(140, 142, 144));
        }
        if (this.is_drop_bottom_selected) {
            gr.DrawLine(this.x, this.y + this.h - 1, this.x + this.w, this.y + this.h - 1, 2, this.is_drop_boundary_reached ? _.RGB(255, 165, 0) : _.RGB(140, 142, 144));
        }

        //---> RATING
        var rating_padded_w = 0;
        if (properties_v2.show_rating.get()) {
            rating_padded_w = rating.w + rating_right_pad + rating_left_pad;
        }

        //---> QUEUE
        if (!_.isNil(this.queue_idx)) {
            gr.FillSolidRect(this.x, this.y, this.w, this.h, pl_colors.row_queued);
        }

        var queue_text = '';
        if (properties_v2.show_queue_position.get() && !_.isNil(this.queue_idx)) {
            queue_text = '  [' + this.queue_idx + ']';
            if (this.queue_idx_count > 1) {
                queue_text += '*' + this.queue_idx_count;
            }
        }

        //---> COUNT
        if (_.isNil(count_text)) {
            var is_radio = (_.tf('%path%', this.metadb).indexOf('http') === 0);
            count_text = (is_radio ? '' : _.tf('%play_count%', this.metadb));
            if (properties_v2.show_playcount.get() && count_text) {
                count_text += ' |';
            }
        }

        var count_w = 0;
        if (properties_v2.show_playcount.get() && count_text) {
            count_w = gr.MeasureString(count_text, pl_fonts.playcount, 0, 0, 0, 0).Width;
        }

        //---> LENGTH
        if (_.isNil(length_text)) {
            length_text = _.tf('[%length%]', this.metadb);
        }
        var length_w = length_text ? 50 : 0;

        //---> TITLE
        var title_and_artist_w = this.w - length_w - count_w - rating_padded_w;
        if (_.isNil(title_text) || _.isNil(title_artist_text)) {
            var gic = this.num_in_header;
            var track_num = (((gic) < 10) ? ('0' + (gic)) : (gic));
            var path = _.tf('%path%', metadb);
            var title_query = '$if(%tracknumber%,%tracknumber%.,' + track_num + '.)  %title%';
            title_text = ( fb.IsPlaying && _.startsWith(path, 'http') && this.is_playing ) ? _.tfe(title_query) : _.tf(title_query, metadb);
            title_artist_text = _.tf('[  \u25AA  $if($greater($len(%album artist%),1),$if($greater($len(%track artist%),1),%track artist%))]', metadb);
        }

        //---> TITLE draw
        if (title_artist_text) {
            var title_text_w = gr.MeasureString(title_text, titleFont, 0, 0, 0, 0, StringFormat(0, 1, 3, 0x00000800 | 0x1000)).Width;
            var title_artist_font = gdi.font('Segoe Ui Semibold', 12, 0);
            gr.DrawString(title_artist_text + queue_text, title_artist_font, titleArtistColor, this.x + 10 + title_text_w, this.y, title_and_artist_w - 10 - title_text_w, this.h, StringFormat(0, 1, 3, 0x1000));
        }
        gr.DrawString(title_text + (title_artist_text ? '' : queue_text), titleFont, titleColor, this.x + 10, this.y, title_and_artist_w - 10, this.h, StringFormat(0, 1, 3, 0x1000));

        var testRect = false;
        testRect && gr.DrawRect(this.x, this.y - 1, title_and_artist_w, this.h, 1, _.RGBA(155, 155, 255, 250));

        //---> LENGTH draw
        var length_x = this.x + this.w - length_w - rating_padded_w;
        gr.DrawString(length_text, titleFont, titleColor, length_x, this.y, length_w, this.h, StringFormat(1, 1));
        testRect && gr.DrawRect(length_x, this.y - 1, length_w, this.h, 1, _.RGBA(155, 155, 255, 250));

        //---> COUNT draw
        if (properties_v2.show_playcount.get() && count_text) {
            var count_x = this.x + this.w - length_w - count_w - rating_padded_w;
            gr.DrawString(count_text, pl_fonts.playcount, countColor, count_x, this.y, count_w, this.h, StringFormat(1, 1));
            testRect && gr.DrawRect(count_x, this.y - 1, count_w, this.h, 1, _.RGBA(155, 155, 255, 250));
        }

        //---> RATING draw
        if (properties_v2.show_rating.get()) {
            rating.draw(gr, titleColor);
        }
    };

    var throttled_repaint = _.throttle(_.bind(function () {
        window.RepaintRect(this.x, this.y, this.w, this.h);
    }, this), 1000 / 60);
    this.repaint = function () {
        throttled_repaint();
    };

    this.trace = function (x, y) {
        return x >= this.x && x < this.x + this.w && y >= this.y && y < this.y + this.h;
    };

    this.set_y = function (y) {
        this.y = y;
        if (rating) {
            rating.y = y;
        }
    };

    this.set_w = function (w) {
        this.w = w;
        initialize_rating();
    };

    this.reset_queried_data = function () {
        title_text = undefined;
        title_artist_text = undefined;
        count_text = undefined;
        length_text = undefined;

        if (rating) {
            rating.reset_queried_data();
        }
    };

    this.rating_trace = function (x, y) {
        if (!rating) {
            return false;
        }
        return rating.trace(x, y);
    };

    this.rating_click = function (x, y) {
        if (!rating) {
            throw Error('Logic error:\n Rating_click was called, when there wass no rating object.\nShould use trace before calling click');
        }
        rating.click(x, y);
    };

    this.is_selected_dynamic = function () {
        if (properties_v2.is_selection_dynamic.get()) {
            return !!plman.IsPlaylistItemSelected(cur_playlist_idx, this.idx);
        }
        return this.is_selected_static;
    };

    function initialize_rating() {
        if (!properties_v2.show_rating.get()) {
            return;
        }

        rating = new Rating(0, that.y, 0, that.h, metadb);
        rating.x = that.x + that.w - rating.w - rating_right_pad;
    }

    //public:
    this.type = 'Row';
    this.idx = idx;
    this.metadb = metadb;

    //const after header creation
    this.is_odd = false;
    this.num_in_header = undefined;
    this.header_idx = undefined;

    this.queue_idx = undefined;
    this.queue_idx_count = 0;

    //state
    this.is_playing = false;
    this.is_focused = false;
    this.is_selected_static = false;
    this.is_drop_boundary_reached = false;
    this.is_drop_bottom_selected = false;
    this.is_drop_top_selected = false;
    this.is_cropped = false;

    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    //private:
    var that = this;

    var cur_playlist_idx = cur_playlist_idx_arg;

    var rating_left_pad = 0;
    var rating_right_pad = 10;
    var rating = undefined;

    var title_text = undefined;
    var title_artist_text = undefined;
    var count_text = undefined;
    var length_text = undefined;

    initialize_rating();
}

function Header(x, y, w, h, idx) {
    //public:
    this.draw = function (gr) {
        if (properties_v2.use_compact_header.get()) {
            this.draw_compact_header(gr)
        }
        else {
            this.draw_normal_header(gr);
        }
    };

    var throttled_repaint = _.throttle(_.bind(function () {
        window.RepaintRect(this.x, this.y, this.w, this.h);
    }, this), 1000 / 60);
    this.repaint = function () {
        throttled_repaint();
    };

    this.draw_normal_header = function (gr) {
        var artist_color = pl_colors.artist_normal;
        var album_color = pl_colors.album_normal;
        var info_color = pl_colors.info_normal;
        var date_color = pl_colors.date_normal;
        var line_color = pl_colors.line_normal;
        var date_font = pl_fonts.date;
        var artist_font = pl_fonts.artist_normal;

        if (this.is_playing()) {
            artist_color = pl_colors.artist_playing;
            album_color = pl_colors.album_playing;
            info_color = pl_colors.info_playing;
            date_color = pl_colors.date_playing;
            line_color = pl_colors.line_playing;
            artist_font = pl_fonts.artist_playing;
        }
        if (this.is_selected_dynamic()) {
            line_color = pl_colors.line_selected;
            artist_color = album_color = date_color = info_color = pl_colors.group_title_selected;
        }

        var clipImg = gdi.CreateImage(this.w, this.h);
        var grClip = clipImg.GetGraphics();

        gr.FillSolidRect(this.x, this.y, this.w, this.h, pl_colors.background);
        grClip.FillSolidRect(0, 0, this.w, this.h, pl_colors.background); // Solid background for ClearTypeGridFit text rendering

        if (this.is_selected_dynamic()) {
            grClip.FillSolidRect(0, 0, this.w, this.h, pl_colors.row_selected);
        }

        grClip.SetTextRenderingHint(TextRenderingHint.ClearTypeGridFit);

        if (this.is_collapsed && is_focused()) {
            grClip.DrawRect(2, 2, this.w - 4, this.h - 4, 1, line_color);
        }

        //************************************************************//

        var left_pad = 10;

        //---> Artbox
        if (properties_v2.show_album_art.get()) {
            var p = 6;
            var has_art = !properties_v2.auto_album_art.get() || art !== null;
            var art_box_x = 0;
            var art_box_w = 0;
            var art_box_size = this.h - p * 2;
            var art_box_y = p;
            var art_box_h = art_box_size;
            if (has_art) {
                art_box_x = p;
                art_box_w = art_box_size;
            }

            if (art) {
                var art_x = art_box_x + 2;
                var art_y = art_box_y + 2;
                var art_h = art.Height;
                var art_w = art.Width;
                if (art_h > art_w) {
                    art_box_w = art_w + 4;
                }
                else {
                    art_box_h = art_h + 4;
                    art_y += Math.round((art_max_size - art_h) / 2);
                    art_box_y = art_y - 2;
                }
                grClip.DrawImage(art, art_x, art_y, art_w, art_h, 0, 0, art_w, art_h, 0, 220);
            }
            else if (!properties_v2.auto_album_art.get()) {
                if (art === null) {
                    grClip.DrawString('NO COVER', pl_fonts.cover, _.RGB(100, 100, 100), art_box_x, art_box_y, art_box_size, art_box_size, StringFormat(1, 1));
                }
                else { // === undefined
                    grClip.DrawString('LOADING', pl_fonts.cover, line_color, art_box_x, art_box_y, art_box_size, art_box_size, StringFormat(1, 1));
                }
            }

            grClip.DrawRect(art_box_x, art_box_y, art_box_w - 1, art_box_h - 1, 1, line_color);

            left_pad += art_box_x + art_box_w;
        }

        //************************************************************//
        var path = _.tf('%path%', metadb);
        var is_radio = _.startsWith(path, 'http');

        // part1: artist
        // part2: album + line + Date OR line
        // part3: info OR album
        var part1_cur_x = left_pad;
        var part2_cur_x = left_pad;
        var part3_cur_x = left_pad;

        var part_h = (!properties_v2.show_group_info.get()) ? this.h / 2 : this.h / 3;
        var part2_right_pad = 0;

        //---> DATE
        if (properties_v2.group_query_id.get() !== 0 ) {
            var date_text = _.tf('%date%', metadb);
            if (date_text === '?' && is_radio) {
                date_text = '';
            }
            var date_w = Math.ceil(gr.MeasureString(date_text, date_font, 0, 0, 0, 0).Width + 5);
            var date_x = this.w - date_w - 5;
            var date_y = 0;
            var date_h = this.h;

            if (properties_v2.group_query_id.get() > 0 && date_x > left_pad) {
                grClip.DrawString(date_text, date_font, date_color, date_x, date_y, date_w, date_h, StringFormat(0, 1));
            }

            part2_right_pad += this.w - date_x;
        }

        //---> ARTIST
        {
            var artist_x = part1_cur_x;
            var artist_w = this.w - artist_x;
            var artist_h = part_h;
            if (!properties_v2.show_group_info.get()) {
                artist_w -= part2_right_pad + 5;
                artist_h -= 5;
            }
            var artist_text = _.tf('$if($greater($len(%album artist%),0),%album artist%,%artist%)', metadb);
            if (artist_text === '?' && is_radio) {
                artist_text = 'Radio Stream';
            }

            grClip.DrawString(artist_text, artist_font, artist_color, artist_x, 0, artist_w, artist_h, StringFormat(0, 2, 3, 0x1000));

            part1_cur_x += artist_w;
        }

        //---> ALBUM
        if (properties_v2.group_query_id.get() > 0) {
            var album_h = part_h;
            var album_y = part_h;
            var album_x;
            if (properties_v2.show_group_info.get()) {
                album_x = part2_cur_x
            }
            else {
                album_y += 5;
                album_x = part3_cur_x
            }
            var album_w = this.w - album_x - (part2_right_pad + 5);

            var album_text = _.tf('%album%[ - %ALBUMSUBTITLE%]', metadb);
            if (album_text === '?' && is_radio) {
                album_text = '';
            }

            grClip.DrawString(album_text, pl_fonts.album, album_color, album_x, album_y, album_w, album_h, StringFormat(0, properties_v2.show_group_info.get() ? 1 : 0, 3, 0x1000));

            var album_text_w = gr.MeasureString(album_text, pl_fonts.album, 0, 0, 0, 0).Width;
            if (properties_v2.show_group_info.get()) {
                part2_cur_x += album_text_w;
            }
            else {
                part3_cur_x += album_text_w;
            }
        }

        //---> INFO
        if (properties_v2.show_group_info.get()) {
            var info_x = part3_cur_x;
            var info_y = 2 * part_h;
            var info_h = row_h;
            var info_w = this.w - info_x;

            var bitspersample = _.tf('$Info(bitspersample)', metadb);
            var samplerate = _.tf('$Info(samplerate)', metadb);
            var sample = ((bitspersample > 16 || samplerate > 44100) ? ' ' + bitspersample + 'bit/' + samplerate / 1000 + 'khz' : '');
            var codec = _.tf('$ext(%path%)', metadb);

            if (codec === 'cue') {
                codec = _.tf('$ext($Info(referenced_file))', metadb);
            }
            else if (codec === 'mpc') {
                codec = codec + '-' + _.tf('$Info(codec_profile)', metadb).replace('quality ', 'q');
            }
            else if (_.tf('$Info(encoding)', metadb) === 'lossy') {
                if (_.tf('$Info(codec_profile)', metadb) === 'CBR') {
                    codec = codec + '-' + _.tf('%bitrate%', metadb) + ' kbps';
                }
                else {
                    codec = codec + '-' + _.tf('$Info(codec_profile)', metadb);
                }
            }
            if (codec) {
                codec = codec + sample;
            }
            else {
                codec = (_.startsWith(path, 'www.youtube.com') || _.startsWith(path, 'youtube.com')) ? 'yt' : path;
            }

            var track_count = this.rows.length;
            var genre = is_radio ? '' : (properties_v2.group_query_id.get() ? '[%genre% | ]' : '');
            var disc_number = (properties_v2.group_query_id.get() === 2 && _.tf('[%totaldiscs%]', metadb) !== '1') ? _.tf('[ | Disc: %discnumber%/%totaldiscs%]', metadb) : '';
            var info = _.tf(genre + codec + disc_number + '[ | %replaygain_album_gain%]', metadb) + (is_radio ? '' : ' | ' + track_count + (track_count === 1 ? ' Track' : ' Tracks'));
            if (get_duration()) {
                info += ' | Time: ' + get_duration();
            }

            grClip.DrawString(info, pl_fonts.info, info_color, info_x, info_y, info_w, info_h, StringFormat(0, 0, 3, 0x1000));

            //---> Info line
            var info_text_h = Math.ceil(gr.MeasureString(info, pl_fonts.info, 0, 0, 0, 0).Height + 5);
            var line_x1 = left_pad;
            var line_x2 = this.w - this.x - 10;
            var line_y = info_y + info_text_h;
            if (line_x2 - line_x1 > 0) {
                grClip.DrawLine(line_x1, line_y, line_x2, line_y, 1, line_color);
            }
        }

        //---> Part 2 line
        {
            var line_x1 = part2_cur_x;
            if ( properties_v2.show_group_info.get() ){
                line_x1 += 10;
            }
            var line_x2 = this.w - part2_right_pad - 10;
            var line_y = Math.round(this.h/2) + 1;

            if (line_x2 - line_x1 > 0) {
                grClip.DrawLine(line_x1, line_y, line_x2, line_y, 1, line_color);
            }
        }

        clipImg.ReleaseGraphics(grClip);
        gr.DrawImage(clipImg, this.x, this.y, this.w, this.h, 0, 0, this.w, this.h, 0, 255);
        clipImg.Dispose();
    };

    this.draw_compact_header = function (gr) {
        var artist_color = pl_colors.artist_normal;
        var album_color = pl_colors.album_normal;
        var date_color = pl_colors.date_normal;
        var line_color = pl_colors.line_normal;
        var date_font = pl_fonts.date_compact;
        var artist_font = pl_fonts.artist_normal_compact;

        if (this.is_playing()) {
            artist_color = pl_colors.artist_playing;
            album_color = pl_colors.album_playing;
            date_color = pl_colors.date_playing;
            line_color = pl_colors.line_playing;

            artist_font = pl_fonts.artist_playing_compact;
        }
        if (this.is_selected_dynamic()) {
            line_color = pl_colors.line_selected;
            artist_color = album_color = date_color = pl_colors.group_title_selected;
        }

        var clipImg = gdi.CreateImage(this.w, this.h);
        var grClip = clipImg.GetGraphics();

        gr.FillSolidRect(this.x, this.y, this.w, this.h, pl_colors.background);

        //--->
        grClip.FillSolidRect(0, 0, this.w, this.h, pl_colors.background); // Solid background for ClearTypeGridFit text rendering
        if (this.is_selected_dynamic()) {
            grClip.FillSolidRect(0, 0, this.w, this.h, pl_colors.row_selected);
        }

        grClip.SetTextRenderingHint(TextRenderingHint.ClearTypeGridFit);

        if (this.is_collapsed && is_focused()) {
            grClip.DrawRect(2, 2, this.w - 4, this.h - 4, 1, line_color);
        }

        //************************************************************//

        var path = _.tf('%path%', metadb);
        var is_radio = _.startsWith(path, 'http');

        var left_pad = 10;
        var right_pad = 0;
        var cur_x = left_pad;

        //---> DATE
        if (properties_v2.group_query_id.get() !== 0 ) {
            var date_text = _.tf('%date%', metadb);
            if (date_text === '?' && is_radio) {
                date_text = '';
            }
            var date_w = Math.ceil(gr.MeasureString(date_text, date_font, 0, 0, 0, 0).Width + 5);
            var date_x = this.w - date_w - 5;
            var date_y = 0;
            var date_h = this.h;

            if (properties_v2.group_query_id.get() > 0 && date_x > left_pad) {
                grClip.DrawString(date_text, date_font, date_color, date_x, date_y, date_w, date_h, StringFormat(0, 1));
            }

            right_pad += this.w - date_x;
        }

        //---> ARTIST
        {
            var artist_x = cur_x;
            var artist_w = this.w - artist_x - (right_pad + 5);
            var artist_h = this.h;

            var artist_text = _.tf('$if($greater($len(%album artist%),0),%album artist%,%artist%)', metadb);
            if (artist_text === '?' && is_radio) {
                artist_text = 'Radio Stream';
            }

            grClip.DrawString(artist_text, artist_font, artist_color, artist_x, 0, artist_w, artist_h, StringFormat(0, 1, 3, 0x1000));

            cur_x += gr.MeasureString(artist_text, artist_font, 0, 0, 0, 0).Width;
        }

        //---> ALBUM
        if (properties_v2.group_query_id.get() > 0) {
            var album_h = this.h;
            var album_x = cur_x;
            var album_w = this.w - album_x - 5;

            var album_text = _.tf(' - %album%[ - %ALBUMSUBTITLE%]', metadb);
            if (album_text === '?' && is_radio) {
                album_text = '';
            }

            grClip.DrawString(album_text, pl_fonts.album, album_color, album_x, 0, album_w, album_h, StringFormat(0, 1, 3, 0x1000));

            cur_x += gr.MeasureString(album_text, pl_fonts.album, 0, 0, 0, 0).Width;
        }

        clipImg.ReleaseGraphics(grClip);
        gr.DrawImage(clipImg, this.x, this.y, this.w, this.h, 0, 0, this.w, this.h, 0, 255);
        clipImg.Dispose();
    };

    this.trace = function (x, y) {
        return x >= this.x && x < this.x + this.w && y >= this.y && y < this.y + this.h;
    };

    this.set_w = function (w) {
        this.w = w;
    };

    this.assign_art = function (image) {
        if (!image || !properties_v2.show_album_art.get()) {
            art = null;
            return;
        }

        var ratio = image.Height / image.Width;
        var art_h = art_max_size;
        var art_w = art_max_size;
        if (image.Height > image.Width) {
            art_w = Math.round(art_h / ratio);
        }
        else {
            art_h = Math.round(art_w * ratio);
        }

        art = image.Resize(art_w, art_h);
    };

    this.has_art = function () {
        return art !== undefined;
    };

    this.init_rows = function (rows_to_process) {
        this.rows = [];
        if (!rows_to_process.length) {
            return;
        }

        var group = _.tf(properties_v2.group_query.get(), rows_to_process[0].metadb);
        _.forEach(rows_to_process, _.bind(function (item, i) {
            var cur_group = _.tf(properties_v2.group_query.get(), item.metadb);
            if (group !== cur_group) {
                return false;
            }
            item.num_in_header = i + 1;
            if (properties_v2.show_header.get()) {
                item.is_odd = (i + 1) % 2;
            }
            item.header_idx = this.idx;
            this.rows.push(item);
        }, this));

        metadb = this.rows[0].metadb;
    };

    this.is_selected_dynamic = function () {
        if (properties_v2.is_selection_dynamic.get()) {
            var is_selected = false;
            _.forEach(that.rows, function (item) {
                if (item.is_selected_dynamic()) {
                    is_selected = true;
                    return false;
                }
            });
            return is_selected;
        }

        return this.is_selected_static;
    };

    this.is_playing = function () {
        var is_playing = false;
        _.forEach(that.rows, function (item) {
            if (item.is_playing) {
                is_playing = true;
                return false;
            }
        });
        return is_playing;
    };

    //private:
    // TODO: consider moving this to playlist
    function is_focused() {
        var is_focused = false;
        _.forEach(that.rows, function (item) {
            if (item.is_focused) {
                is_focused = true;
                return false;
            }
        });
        return is_focused;
    }

    function get_duration() {
        var duration_in_seconds = 0;

        that.rows.forEach(function (item) {
            var trackLength = parseFloat(_.tf('%length_seconds_fp%', item.metadb));
            if (trackLength) {
                duration_in_seconds += trackLength;
            }
        });

        if (!duration_in_seconds) {
            return '';
        }

        return utils.FormatDuration(duration_in_seconds);
    }

    //public:
    this.type = 'Header';
    this.idx = idx;

    this.rows = [];

    this.is_selected_static = false;
    this.is_collapsed = false;

    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    //private:
    var that = this;
    var row_h = properties_v2.row_h.get();
    var art_max_size = that.h - 16;

    var metadb;
    var art = undefined;
}

function SelectionHandler(rows_arg, headers_arg, cur_playlist_idx_arg) {
    this.initialize_selection = function () {
        selected_indexes = [];
        rows.forEach(function (item, i) {
            if (plman.IsPlaylistItemSelected(cur_playlist_idx, item.idx)) {
                item.is_selected_static = true;
            }
            if (item.is_selected_static) {
                selected_indexes.push(i);
            }
        });
    };

    // changes focus and selection
    this.update_selection = function (item, ctrl_pressed, shift_pressed) {
        if (_.isNil(item)) {
            throw Error('Logic error:\n update_selection was called with undefined item');
        }

        if (!ctrl_pressed && !shift_pressed) {
            selected_indexes = [];
            last_single_selected_index = undefined;
        }

        if (item.type === 'Header') {
            update_selection_with_header(item, ctrl_pressed, shift_pressed);
        }
        else {
            update_selection_with_row(item, ctrl_pressed, shift_pressed);
        }
    };

    this.select_all = function () {
        if (!rows.length) {
            return;
        }

        selected_indexes = _.range(_.head(rows).idx, _.last(rows).idx);
        last_single_selected_index = _.head(rows).idx;

        plman.SetPlaylistSelection(cur_playlist_idx, selected_indexes, true);
        plman.SetPlaylistFocusItem(cur_playlist_idx, last_single_selected_index);
    };

    this.clear_selection = function () {
        if (!selected_indexes.length) {
            return;
        }
        selected_indexes = [];
        last_single_selected_index = undefined;
        plman.ClearPlaylistSelection(cur_playlist_idx);
    };

    this.sync_items_with_selection = function () {
        if (properties_v2.is_selection_dynamic.get()) {
            return;
        }

        // TODO: this code is VERY expensive! Use with care.
        headers.forEach(function (item) {
            item.is_selected_static = false;
        });
        rows.forEach(function (item) {
            item.is_selected_static = false;
            //item.is_drop_top_selected = false;
            //item.is_drop_bottom_selected = false;
            //item.is_drop_selected = false;
        });

        if (selected_indexes.length !== 0) {
            selected_indexes.forEach(function (idx) {
                rows[idx].is_selected_static = true;
            });

            headers.forEach(function (item) {
                var row_indexes = [];
                item.rows.forEach(function (item) {
                    row_indexes.push(item.idx);
                });

                item.is_selected_static = _.difference(row_indexes, selected_indexes).length === 0;
            });
        }
    };

    this.has_selected_items = function () {
        return !!selected_indexes.length;
    };

    this.selected_items_count = function () {
        return selected_indexes.length;
    };

    this.enable_drag = function () {
        clear_last_hover_item();
        is_dragging = true;
    };

    this.disable_drag = function () {
        clear_last_hover_item();
        is_dragging = false;
    };

    this.enable_external_drag = function () {
        this.enable_drag();
        is_external_drop = true;

        if (plman.IsPlaylistLocked(cur_playlist_idx)) {
            window.SetCursor(IDC_NO);
        }
    };

    this.disable_external_drag = function () {
        this.disable_drag();
        is_external_drop = false;

        if (plman.IsPlaylistLocked(cur_playlist_idx)) {
            window.SetCursor(IDC_ARROW);
        }
    };

    this.is_dragging = function () {
        return is_dragging;
    };

    this.is_external_drop = function () {
        return is_external_drop;
    };

    // calls repaint
    this.drag = function (item, is_above) {
        if (_.isNil(item)) {
            clear_last_hover_item();
            return;
        }

        if (plman.IsPlaylistLocked(cur_playlist_idx)) {
            return;
        }

        var is_drop_top_selected = is_above;
        var is_drop_bottom_selected = !is_above;
        var is_drop_boundary_reached = item.idx === 0 || (!is_above && item.idx === rows.length - 1);

        if (!is_external_drop) {
            var is_item_above_selected = item.idx !== 0 && rows[item.idx - 1].is_selected_dynamic();
            var is_item_below_selected = item.idx !== (rows.length - 1) && rows[item.idx + 1].is_selected_dynamic();
            is_drop_top_selected &= !item.is_selected_dynamic() && !is_item_above_selected;
            is_drop_bottom_selected &= !item.is_selected_dynamic() && !is_item_below_selected;
        }

        var cur_hover_item = item;

        var needs_repaint = false;
        if (last_hover_item) {
            if (last_hover_item.idx === cur_hover_item.idx) {
                needs_repaint = last_hover_item.is_drop_top_selected !== is_drop_top_selected
                    || last_hover_item.is_drop_bottom_selected !== is_drop_bottom_selected
                    || last_hover_item.is_drop_boundary_reached !== is_drop_boundary_reached;
            }
            else {
                clear_last_hover_item();
                needs_repaint = true;
            }
        }

        cur_hover_item.is_drop_top_selected = is_drop_top_selected;
        cur_hover_item.is_drop_bottom_selected = is_drop_bottom_selected;
        cur_hover_item.is_drop_boundary_reached = is_drop_boundary_reached;

        if (needs_repaint) {
            cur_hover_item.repaint();
        }

        last_hover_item = cur_hover_item;
    };

    // changes focus, selection and playlist order
    this.drop = function () {
        if (!is_dragging) {
            return;
        }

        is_dragging = false;
        if (!selected_indexes.length || !last_hover_item) {
            return;
        }

        if (!last_hover_item.is_drop_top_selected && !last_hover_item.is_drop_bottom_selected) {
            clear_last_hover_item();
            return;
        }

        var drop_idx = last_hover_item.idx;
        if (last_hover_item.is_drop_bottom_selected) {
            ++drop_idx;
        }

        clear_last_hover_item();

        selected_indexes.sort(g_numeric_ascending_sort);

        var is_contiguous = true;
        _.forEach(selected_indexes, function (item, i) {
            if (i === 0) {
                return;
            }
            if ((selected_indexes[i] - selected_indexes[i - 1]) !== 1) {
                is_contiguous = false;
                return false;
            }
        });

        if (is_contiguous) {
            var focus_idx = plman.GetPlaylistFocusItemIndex(cur_playlist_idx);
            var move_delta;
            if (drop_idx > focus_idx) {
                move_delta = drop_idx - _.last(selected_indexes) - 1;
            }
            else {
                move_delta = drop_idx - _.head(selected_indexes);
            }

            plman.MovePlaylistSelection(cur_playlist_idx, move_delta);
        }
        else {
            // TODO: metadb is not unique, might cause problems, if playlist contains multiple copies of the same item
            var saved_focus_metadb = rows[plman.GetPlaylistFocusItemIndex(cur_playlist_idx)].metadb;
            // Move to end
            plman.MovePlaylistSelection(cur_playlist_idx, plman.PlaylistItemCount(cur_playlist_idx));
            // Get new drop position
            plman.SetPlaylistFocusItemByHandle(cur_playlist_idx, rows[drop_idx].metadb);
            var new_drop_idx = plman.GetPlaylistFocusItemIndex(cur_playlist_idx);

            plman.SetPlaylistFocusItemByHandle(cur_playlist_idx, saved_focus_metadb);

            var move_delta = new_drop_idx - ( rows.length - selected_indexes.length );
            plman.MovePlaylistSelection(cur_playlist_idx, move_delta);
        }
    };

    this.prepare_drop_external = function () {
        is_dragging = false;
    };

    this.can_drop = function () {
        return !plman.IsPlaylistLocked(cur_playlist_idx);
    };

    this.drop_external = function () {
        // this is done after dragging ends, no need to check the drag
        if (last_hover_item) {
            var drop_idx = last_hover_item.idx;
            if (last_hover_item.is_drop_bottom_selected) {
                ++drop_idx;
            }

            plman.MovePlaylistSelection(cur_playlist_idx, -(rows.length - drop_idx));
            plman.SetPlaylistFocusItem(cur_playlist_idx, drop_idx);
        }
        else {
            // For correct initialization
            plman.MovePlaylistSelection(cur_playlist_idx, 1);
        }
        this.disable_external_drag();
    };

    this.copy = function () {
        if (!selected_indexes.length) {
            return fb.CreateHandleList();
        }

        return plman.GetPlaylistSelectedItems(cur_playlist_idx);
    };

    this.cut = function () {
        if (!selected_indexes.length) {
            return fb.CreateHandleList();
        }

        plman.UndoBackup(cur_playlist_idx);
        return plman.GetPlaylistSelectedItems(cur_playlist_idx);
    };

    this.paste = function (metadb_list) {
        if (!metadb_list || !metadb_list.Count) {
            return;
        }

        plman.UndoBackup(cur_playlist_idx);
        if (selected_indexes.length) {
            plman.ClearPlaylistSelection(cur_playlist_idx);
            plman.InsertPlaylistItems(cur_playlist_idx, plman.GetPlaylistFocusItemIndex(cur_playlist_idx), metadb_list, true);
        }
        else {
            plman.InsertPlaylistItems(cur_playlist_idx, rows.length, metadb_list, true);
        }
        this.initialize_selection();
    };

    // changes focus and selection
    function update_selection_with_row(item, ctrl_pressed, shift_pressed) {
        if (ctrl_pressed) {
            var is_selected = _.find(selected_indexes, function (idx) {
                return item.idx === idx;
            });

            if (is_selected) {
                _.remove(selected_indexes, function (idx) {
                    return idx === item.idx;
                });
            }
            else {
                selected_indexes.push(item.idx);
            }

            last_single_selected_index = item.idx;

            plman.SetPlaylistSelectionSingle(cur_playlist_idx, item.idx, !is_selected);
        }
        else if (shift_pressed && selected_indexes.length) {
            var a = 0,
                b = 0;

            selected_indexes.sort(g_numeric_ascending_sort);

            if (_.isNil(last_single_selected_index)) {
                last_single_selected_index = plman.GetPlaylistFocusItemIndex(cur_playlist_idx);
            }

            if (last_single_selected_index < item.idx) {
                a = last_single_selected_index;
                b = item.idx;
            }
            else {
                a = item.idx;
                b = last_single_selected_index;
            }

            selected_indexes = _.range(a, b + 1);

            plman.ClearPlaylistSelection(cur_playlist_idx);
            plman.SetPlaylistSelection(cur_playlist_idx, selected_indexes, true);
        }
        else {
            selected_indexes.push(item.idx);
            last_single_selected_index = item.idx;

            plman.ClearPlaylistSelection(cur_playlist_idx);
            plman.SetPlaylistSelectionSingle(cur_playlist_idx, item.idx, true);
        }

        plman.SetPlaylistFocusItem(cur_playlist_idx, item.idx);
    }

    // changes focus and selection
    function update_selection_with_header(item, ctrl_pressed, shift_pressed) {
        var row_indexes = [];

        item.rows.forEach(_.bind(function (row) {
            row_indexes.push(row.idx);
        }, this));

        if (ctrl_pressed) {
            var is_selected = _.difference(row_indexes, selected_indexes).length === 0;
            if (is_selected) {
                _.pullAll(selected_indexes, row_indexes);
            }
            else {
                selected_indexes = _.union(selected_indexes, row_indexes);
            }
            last_single_selected_index = row_indexes[0].idx;
        }
        else if (shift_pressed && selected_indexes.length) {
            var a = 0,
                b = 0;

            selected_indexes.sort(g_numeric_ascending_sort);

            if (_.isNil(last_single_selected_index)) {
                last_single_selected_index = selected_indexes[0];
            }

            if (last_single_selected_index < item.rows[0].idx) {
                a = last_single_selected_index;
                b = item.rows[0].idx;
            }
            else {
                a = item.rows[0].idx;
                b = last_single_selected_index;
            }

            selected_indexes = _.union(_.range(a, b + 1), row_indexes);
        }
        else {
            selected_indexes = row_indexes;
            last_single_selected_index = row_indexes[0].idx;
        }

        plman.ClearPlaylistSelection(cur_playlist_idx);
        plman.SetPlaylistSelection(cur_playlist_idx, selected_indexes, true);
        if (row_indexes.length) {
            plman.SetPlaylistFocusItem(cur_playlist_idx, _.head(row_indexes));
        }
    }

    function clear_last_hover_item() {
        if (last_hover_item) {
            last_hover_item.is_drop_bottom_selected = false;
            last_hover_item.is_drop_top_selected = false;
            last_hover_item.is_drop_boundary_reached = false;
            last_hover_item.repaint();
        }
    }

    var rows = rows_arg;
    var headers = headers_arg;
    var cur_playlist_idx = cur_playlist_idx_arg;
    var selected_indexes = [];
    var last_single_selected_index = undefined;
    var is_dragging = false;
    var is_external_drop = false;
    var last_hover_item = undefined;

    this.initialize_selection();
}

function CollapseHandler() {
    this.initialize = function (headers_arg) {
        headers = headers_arg;
        this.changed = false;
        if (properties_v2.collapse_on_playlist_switch.get()) {
            if (properties_v2.auto_colapse.get()) {
                this.collapse_all_but_now_playing()
            }
            else {
                this.collapse_all();
            }
        }
    };

    this.toggle_collapse = function (item) {
        this.changed = true;
        item.is_collapsed = !item.is_collapsed;

        trigger_callback();
    };

    this.collapse = function (item) {
        this.changed = item.is_collapsed !== true;
        item.is_collapsed = true;

        trigger_callback();
    };

    this.expand = function (item) {
        this.changed = item.is_collapsed !== false;
        item.is_collapsed = false;

        trigger_callback();
    };

    this.collapse_all = function () {
        this.changed = false;
        headers.forEach(_.bind(function (item) {
            this.changed |= item.is_collapsed !== true;
            item.is_collapsed = true;
        }, this));

        trigger_callback();
    };

    this.collapse_all_but_now_playing = function () {
        this.changed = false;
        headers.forEach(_.bind(function (item) {
            if (item.is_playing()) {
                this.changed |= item.is_collapsed !== false;
                item.is_collapsed = false;
                return;
            }
            this.changed |= item.is_collapsed !== true;
            item.is_collapsed = true;
        }, this));

        trigger_callback();
    };

    this.expand_all = function () {
        this.changed = false;
        headers.forEach(_.bind(function (item) {
            this.changed |= item.is_collapsed !== false;
            item.is_collapsed = false;
        }, this));

        trigger_callback();
    };

    this.set_callback = function(on_collapse_change_callback_arg) {
        on_collapse_change_callback = on_collapse_change_callback_arg;
    };

    function trigger_callback() {
        if (that.changed && on_collapse_change_callback) {
            on_collapse_change_callback();
        }
    }

    this.changed = false;

    var that = this;
    var headers = [];
    var on_collapse_change_callback = undefined;
}