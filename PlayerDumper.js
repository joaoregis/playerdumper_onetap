var ScreenSize = null;
var watermark_font_title = null;
var watermark_font_content = null;
var shouldRenderMenu = true;

const ENABLE_DUMPER = "Enable Player Dumper";
const DUMPER_KEY = "Player Dump Key";
const DUMPER_OPTIONS = "Dumper Filters";
const X_POSITION = "Indicator X";
const Y_POSITION = "Indicator Y";
const RAINBOW_SPEED = "Rainbow Speed";
const MIN_ALPHA = "Minimum Alpha";

function hud() {

    ScreenSize = Render.GetScreenSize();

    UI.AddLabel("");
    UI.AddLabel("D U M P E R");

    UI.AddCheckbox(ENABLE_DUMPER);
    UI.AddHotkey(DUMPER_KEY);
    UI.AddMultiDropdown(DUMPER_OPTIONS, ["CT Side", "T Side",]);
    UI.AddSliderInt(RAINBOW_SPEED, 1, 16);
    UI.AddSliderInt(MIN_ALPHA, 50, 255);

    UI.AddSliderInt(X_POSITION, 0, ScreenSize[0]);
    UI.AddSliderInt(Y_POSITION, 0, ScreenSize[1]);

    UI.AddLabel("");

}

var mm_ranks = [
    "Unranked", "Silver I", "Silver II", "Silver III",
    "Silver IV", "Silver Elite", "Silver Elite Master",
    "Gold I", "Gold II", "Gold III", "Gold IV",
    "AK I", "AK II", "AK X", "Xefire",
    "Eagle I", "Eagle II", "Supreme", "Global"
];

var playerListTR = [];
var playerListCT = [];

function in_bounds(vec, x, y, x2, y2) {
    return (vec[0] > x) && (vec[1] > y) && (vec[0] < x2) && (vec[1] < y2)
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

var oldTick = Global.Tickcount()
var ticksToDelay = 1 //1 second you can do the math from this point :D
var alpha = 50
var up = true
function rainbowColors() {

    var min_alpha = UI.GetValue("Misc", "JAVASCRIPT", "Script items", MIN_ALPHA);
    var speed = UI.GetValue("Misc", "JAVASCRIPT", "Script items", RAINBOW_SPEED);
    if (Entity.IsValid(Entity.GetLocalPlayer())) {

        var curTick = Global.Tickcount()
        if (oldTick > curTick + ticksToDelay * speed * 3) {
            oldTick = Global.Tickcount()
        }

        if (curTick > oldTick + (ticksToDelay * speed)) {
            if (up) {
                alpha += 10
            }
            if (!up) {
                alpha -= 10
            }
            oldTick = Global.Tickcount()
        }

        if (alpha >= 255) {
            alpha = 255
            up = false
        }

        if (alpha <= min_alpha) {
            alpha = min_alpha
            up = true
        }

        var tickcount = Global.Tickcount();
        return HSVtoRGB(tickcount % 350 / 350, 1, 1, 1, 255);
    }
}

function drawTable(x, y) {
    if (playerListTR.concat(playerListCT).length > 0) {

        if (Global.IsKeyPressed(1) && UI.IsMenuOpen()) {
            const mouse_pos = Global.GetCursorPosition();
            if (in_bounds(mouse_pos, x - 180, y, x + 360, y + 41)) {
                UI.SetValue("Misc", "JAVASCRIPT", "Script items", X_POSITION, mouse_pos[0] - 360 / 2);
                UI.SetValue("Misc", "JAVASCRIPT", "Script items", Y_POSITION, mouse_pos[1] - 20);
            }
        }

        const c = rainbowColors();
        Render.FilledRect(x - 180, y - 5, 360, 2, [c.r, c.g, c.b, alpha]);
        Render.FilledRect(x - 180, y - 3, 360, 20, [0, 0, 0, 160]);
        Render.FilledRect(x - 180, y + 17, 360, 20 * playerListTR.concat(playerListCT).length, [1, 1, 1, 160]);
        Render.FilledRect(x - 180, y + 17 + (20 * playerListTR.concat(playerListCT).length), 360, 10, [1, 1, 1, 160]);
    }
}

function onDraw() {

    ScreenSize = Render.GetScreenSize();
    watermark_font_title = Render.AddFont("Verdana", 12, 350);
    watermark_font_content = Render.AddFont("Verdana", 10, 350);

    if (UI.GetValue(ENABLE_DUMPER)) {

        mount_player_list();

        if ((UI.IsHotkeyActive("Misc", "JAVASCRIPT", "Script items", DUMPER_KEY) && shouldRenderMenu) || (UI.IsMenuOpen() && shouldRenderMenu)) {

            var base_x = UI.GetValue(X_POSITION);
            var base_y = UI.GetValue(Y_POSITION);

            drawTable(base_x, base_y);

            Render.StringCustom(base_x, base_y, 1, "Player's Dumped Info", [255, 255, 255, 255], watermark_font_title);
            base_y += 20;

            var playerList = playerListCT.concat(playerListTR);
            var final_string = "";
            for (var i = 0; i < playerList.length; i++) {

                var p = playerList[i];
                final_string +=
                    "[" + p.player_team + "] " + p.player_name +
                    " | Wins: " + p.player_win_amt +
                    " | Rank: " + p.player_rank +
                    "\n";

            }

            Render.StringCustom(base_x, base_y + 5, 1, final_string, [255, 255, 255, 255], watermark_font_content);

        }

    }

}

function mount_player_list() {

    playerListTR = [];
    playerListCT = [];

    var players = Entity.GetPlayers();
    if (players.length > 0) {

        for (var i = 0; i < players.length; i++) {

            if (Entity.IsValid(players[i])) {

                var player_name = Entity.GetName(players[i]);
                var player_win_amt = Entity.GetProp(players[i], "CCSPlayerResource", "m_iCompetitiveWins");
                var player_team_raw = Entity.GetProp(players[i], "CCSPlayerResource", "m_iTeam");
                var player_rank_raw = Entity.GetProp(players[i], "CCSPlayerResource", "m_iCompetitiveRanking");
                var player_rank = mm_ranks[player_rank_raw];
                var is_bot = Entity.IsBot(players[i]);

                var team = "NONE";

                if (is_bot) {
                    player_name = "BOT " + player_name;
                }

                // 3 = both
                // 1 = CT
                // 2 = TR
                const dumperOptions = UI.GetValue(DUMPER_OPTIONS);
                if (dumperOptions === 0) shouldRenderMenu = false;
                else shouldRenderMenu = true;

                switch (player_team_raw) {
                    case 2: // tr
                        team = "TR";

                        if (dumperOptions === 2 || dumperOptions === 3)
                            playerListTR.push({
                                player_obj: players[i],
                                player_name: player_name.trim(),
                                player_win_amt: player_win_amt.toString(),
                                "player_team": team,
                                player_rank,
                                is_bot,
                            });

                        break;
                    case 3: // ct
                        team = "CT";

                        if (dumperOptions === 1 || dumperOptions === 3)
                            playerListCT.push({
                                player_obj: players[i],
                                player_name: player_name.trim(),
                                player_win_amt: player_win_amt.toString(),
                                "player_team": team,
                                player_rank,
                                is_bot,
                            });

                        break;
                    default:
                        break;
                }

            }

        }

    }

}

(function OnLoad() {
    //
    hud();
})()

Cheat.RegisterCallback("Draw", "onDraw");
