extends Node2D

signal exit_to_menu

const BOUNDS := Rect2(-560.0, -320.0, 1120.0, 640.0)
const PATH_LIMIT := 1200
const MOMMY_DELAY := 28
const DADDY_DELAY := 48
const LEVEL_DATA := preload("res://scripts/level_data.gd")

@onready var _ground = $Ground
@onready var _player = $Player
@onready var _mommy = $Mommy
@onready var _daddy = $Daddy
@onready var _decorations = $Decorations
@onready var _collectibles = $Collectibles
@onready var _hud = $HUD

var _collectible_scene := preload("res://scenes/Collectible.tscn")
var _player_path: Array[Vector2] = []
var _items: Array[String] = []
var _collected: Dictionary = {}
var _shimmer_node = null
var _base_shimmer_color: Color = Color(1.0, 1.0, 1.0, 0.4)
var _sway_nodes: Array[Dictionary] = []
var _ambient_time: float = 0.0

func _ready() -> void:
	_ground.polygon = PackedVector2Array([
		Vector2(BOUNDS.position.x, BOUNDS.position.y),
		Vector2(BOUNDS.end.x, BOUNDS.position.y),
		Vector2(BOUNDS.end.x, BOUNDS.end.y),
		Vector2(BOUNDS.position.x, BOUNDS.end.y)
	])
	_player.position_sampled.connect(_on_player_position_sampled)
	_hud.back_requested.connect(func() -> void: emit_signal("exit_to_menu"))

func setup_level(level_key: String) -> void:
	var data: Dictionary = LEVEL_DATA.LEVELS.get(level_key, {})
	if data.is_empty():
		return

	_clear_collectibles()
	_items.clear()
	for item in data.get("items", []):
		_items.append(str(item))
	_collected.clear()
	_player_path.clear()

	_player.global_position = Vector2.ZERO
	_mommy.global_position = Vector2(-70, 40)
	_daddy.global_position = Vector2(-120, -20)
	_apply_character_styles(data)

	_hud.setup(
		str(data.get("mode", "letters")),
		_items,
		str(data.get("title", "Family Follow Adventure")),
		data
	)

	_build_background(level_key, str(data.get("map_theme", "forest")))

	randomize()
	for item in _items:
		var c = _collectible_scene.instantiate()
		var pos := Vector2(
			randf_range(BOUNDS.position.x + 40.0, BOUNDS.end.x - 40.0),
			randf_range(BOUNDS.position.y + 40.0, BOUNDS.end.y - 40.0)
		)
		c.global_position = pos
		c.configure(item, _color_for_item(item))
		c.collected.connect(_on_collectible_collected)
		_collectibles.add_child(c)

func _physics_process(_delta: float) -> void:
	_player.global_position = _player.global_position.clamp(BOUNDS.position, BOUNDS.end)
	_update_follower(_mommy, MOMMY_DELAY)
	_update_follower(_daddy, DADDY_DELAY)
	_mommy.global_position = _mommy.global_position.clamp(BOUNDS.position, BOUNDS.end)
	_daddy.global_position = _daddy.global_position.clamp(BOUNDS.position, BOUNDS.end)

func _process(delta: float) -> void:
	_ambient_time += delta

	if _shimmer_node != null:
		var shimmer := sin(_ambient_time * 2.2) * 0.12
		var color: Color = _base_shimmer_color
		color.a = clampf(_base_shimmer_color.a + shimmer, 0.08, 0.9)
		_shimmer_node.color = color

	for entry in _sway_nodes:
		var node: Node2D = entry.get("node", null)
		if node == null or not is_instance_valid(node):
			continue
		var phase: float = float(entry.get("phase", 0.0))
		var speed: float = float(entry.get("speed", 1.0))
		var amp: float = float(entry.get("amp", 0.015))
		node.rotation = sin(_ambient_time * speed + phase) * amp

func _on_player_position_sampled(pos: Vector2) -> void:
	_player_path.append(pos)
	if _player_path.size() > PATH_LIMIT:
		_player_path.remove_at(0)

func _update_follower(follower, delay: int) -> void:
	if _player_path.size() <= delay:
		return
	var target: Vector2 = _player_path[_player_path.size() - 1 - delay]
	follower.set_follow_target(target, _player.global_position)

func _on_collectible_collected(value: String) -> void:
	if _collected.has(value):
		return
	_collected[value] = true
	_hud.mark_collected(value)
	if _collected.size() == _items.size():
		_hud.show_complete()

func _clear_collectibles() -> void:
	for child in _collectibles.get_children():
		child.queue_free()

func _clear_decorations() -> void:
	for child in _decorations.get_children():
		child.queue_free()
	_shimmer_node = null
	_sway_nodes.clear()
	_ambient_time = 0.0

func _apply_character_styles(data: Dictionary) -> void:
	var char_styles: Dictionary = data.get("char_styles", {})

	_player.look_type = str(char_styles.get("asher", "normal"))
	_player.refresh_appearance()

	_mommy.display_name = "Mommy"
	_mommy.look_type = str(char_styles.get("mommy", "mommy"))
	_mommy.body_color = _follower_color_for_look(_mommy.look_type, true)
	_mommy.refresh_appearance()

	_daddy.display_name = "Daddy"
	_daddy.look_type = str(char_styles.get("daddy", "daddy"))
	_daddy.body_color = _follower_color_for_look(_daddy.look_type, false)
	_daddy.refresh_appearance()

func _follower_color_for_look(look_type: String, is_mommy: bool) -> Color:
	match look_type:
		"bat":
			return Color(0.22, 0.2, 0.32)
		"skeleton":
			return Color(0.88, 0.88, 0.88)
		"daddy":
			return Color(0.55, 0.75, 1.0)
		_:
			if is_mommy:
				return Color(1.0, 0.65, 0.8)
			return Color(0.55, 0.75, 1.0)

func _build_background(level_key: String, map_theme: String) -> void:
	match map_theme:
		"desert":
			_build_desert_background(level_key)
		"mountains":
			_build_mountain_background(level_key)
		"island_chain":
			_build_island_chain_background(level_key)
		"cave":
			_build_cave_background(level_key)
		"house":
			_build_house_background(level_key)
		"trick_or_treat":
			_build_trick_or_treat_background(level_key)
		_:
			_build_forest_background(level_key)

func _build_forest_background(level_key: String) -> void:
	_clear_decorations()
	var palette := {
		"ground": Color("2b5f30"),
		"grass_patch": Color(0.35, 0.72, 0.34, 0.4),
		"river": Color("419cd4"),
		"river_highlight": Color(0.75, 0.93, 1.0, 0.4),
		"tree_leaf": Color("358746"),
		"tree_leaf_dark": Color("28683a"),
		"tree_trunk": Color("765236")
	}
	_ground.color = palette["ground"]

	var river := _make_poly(_river_polygon(level_key), palette["river"])
	_decorations.add_child(river)
	var river_highlight := _make_poly(_river_highlight_polygon(level_key), palette["river_highlight"])
	_decorations.add_child(river_highlight)
	_shimmer_node = river_highlight
	_base_shimmer_color = river_highlight.color

	var rng := _rng_for(level_key, "forest")
	for i in 24:
		var patch := _make_oval_patch(rng, Color(palette["grass_patch"]))
		_decorations.add_child(patch)

	for i in 28:
		var tree := _make_tree(rng.randf_range(0.8, 1.25), Color(palette["tree_leaf"]), Color(palette["tree_leaf_dark"]), Color(palette["tree_trunk"]))
		tree.position = _edge_position(rng, 18.0, 60.0)
		_decorations.add_child(tree)
		_add_sway(tree, rng)

func _build_desert_background(level_key: String) -> void:
	_clear_decorations()
	_ground.color = Color("d8bd73")
	var rng := _rng_for(level_key, "desert")

	for i in 16:
		var dune := Polygon2D.new()
		dune.color = Color(0.92, 0.8, 0.5, 0.45)
		dune.position = Vector2(rng.randf_range(BOUNDS.position.x, BOUNDS.end.x), rng.randf_range(BOUNDS.position.y, BOUNDS.end.y))
		dune.polygon = _oval_points(rng.randf_range(50.0, 120.0), rng.randf_range(18.0, 40.0), 14)
		_decorations.add_child(dune)

	var heat := _make_poly(PackedVector2Array([
		Vector2(BOUNDS.position.x, -35), Vector2(BOUNDS.end.x, -55), Vector2(BOUNDS.end.x, 35), Vector2(BOUNDS.position.x, 15)
	]), Color(1.0, 0.96, 0.85, 0.2))
	_decorations.add_child(heat)
	_shimmer_node = heat
	_base_shimmer_color = heat.color

	for i in 22:
		var cactus := _make_cactus(rng.randf_range(0.8, 1.3))
		cactus.position = _edge_position(rng, 28.0, 90.0)
		_decorations.add_child(cactus)
		_add_sway(cactus, rng, 0.006, 0.014)

func _build_mountain_background(level_key: String) -> void:
	_clear_decorations()
	_ground.color = Color("4f6a3f")
	var rng := _rng_for(level_key, "mountains")

	for i in 5:
		var base_x := lerpf(BOUNDS.position.x + 80.0, BOUNDS.end.x - 80.0, float(i) / 4.0)
		var w := rng.randf_range(170.0, 250.0)
		var h := rng.randf_range(140.0, 220.0)
		var mountain := _make_poly(PackedVector2Array([
			Vector2(base_x - w * 0.5, BOUNDS.position.y + 130.0),
			Vector2(base_x, BOUNDS.position.y + 130.0 - h),
			Vector2(base_x + w * 0.5, BOUNDS.position.y + 130.0)
		]), Color(0.42, 0.45, 0.48, 1.0))
		_decorations.add_child(mountain)

		var snow := _make_poly(PackedVector2Array([
			Vector2(base_x - 36.0, BOUNDS.position.y + 130.0 - h + 52.0),
			Vector2(base_x, BOUNDS.position.y + 130.0 - h),
			Vector2(base_x + 36.0, BOUNDS.position.y + 130.0 - h + 52.0)
		]), Color(0.93, 0.96, 1.0, 0.95))
		_decorations.add_child(snow)

	var lake := _make_poly(PackedVector2Array([
		Vector2(-240, 150), Vector2(-80, 178), Vector2(90, 156), Vector2(220, 185), Vector2(250, 240),
		Vector2(110, 250), Vector2(-70, 265), Vector2(-250, 220)
	]), Color(0.31, 0.61, 0.86, 0.78))
	_decorations.add_child(lake)

	var lake_shine := _make_poly(PackedVector2Array([
		Vector2(-220, 185), Vector2(-80, 205), Vector2(80, 190), Vector2(190, 210),
		Vector2(115, 224), Vector2(-40, 232), Vector2(-200, 214)
	]), Color(0.84, 0.95, 1.0, 0.3))
	_decorations.add_child(lake_shine)
	_shimmer_node = lake_shine
	_base_shimmer_color = lake_shine.color

	for i in 10:
		var bush := _make_ellipse_node(Vector2(rng.randf_range(24.0, 44.0), rng.randf_range(14.0, 24.0)), Color(0.34, 0.57, 0.31, 0.8))
		bush.position = Vector2(rng.randf_range(BOUNDS.position.x + 60.0, BOUNDS.end.x - 60.0), rng.randf_range(90.0, BOUNDS.end.y - 30.0))
		_decorations.add_child(bush)

func _build_island_chain_background(level_key: String) -> void:
	_clear_decorations()
	_ground.color = Color("3e9ccf")
	var rng := _rng_for(level_key, "island_chain")

	var wave := _make_poly(PackedVector2Array([
		Vector2(BOUNDS.position.x, -15), Vector2(BOUNDS.end.x, -35), Vector2(BOUNDS.end.x, 45), Vector2(BOUNDS.position.x, 25)
	]), Color(0.84, 0.97, 1.0, 0.2))
	_decorations.add_child(wave)
	_shimmer_node = wave
	_base_shimmer_color = wave.color

	for i in 8:
		var island_pos := Vector2(rng.randf_range(BOUNDS.position.x + 120.0, BOUNDS.end.x - 120.0), rng.randf_range(BOUNDS.position.y + 80.0, BOUNDS.end.y - 70.0))
		var sand_rx := rng.randf_range(58.0, 96.0)
		var sand_ry := rng.randf_range(34.0, 52.0)
		var sand := _make_ellipse_node(Vector2(sand_rx, sand_ry), Color(0.95, 0.87, 0.62, 1.0))
		sand.position = island_pos
		_decorations.add_child(sand)
		var grass := _make_ellipse_node(Vector2(sand_rx * 0.62, sand_ry * 0.62), Color(0.28, 0.66, 0.35, 1.0))
		grass.position = island_pos + Vector2(0, -3)
		_decorations.add_child(grass)

		var palm := _make_palm_tree(rng.randf_range(0.75, 1.15))
		palm.position = island_pos + Vector2(rng.randf_range(-18.0, 18.0), rng.randf_range(-10.0, 12.0))
		_decorations.add_child(palm)
		_add_sway(palm, rng, 0.015, 0.03)

func _build_cave_background(level_key: String) -> void:
	_clear_decorations()
	_ground.color = Color("1f2127")
	var rng := _rng_for(level_key, "cave")

	for i in 20:
		var rock := _make_ellipse_node(Vector2(rng.randf_range(22.0, 66.0), rng.randf_range(12.0, 30.0)), Color(0.28, 0.29, 0.33, 0.65))
		rock.position = Vector2(rng.randf_range(BOUNDS.position.x, BOUNDS.end.x), rng.randf_range(BOUNDS.position.y, BOUNDS.end.y))
		_decorations.add_child(rock)

	for i in 16:
		var x := lerpf(BOUNDS.position.x + 30.0, BOUNDS.end.x - 30.0, float(i) / 15.0)
		var stal_top := _make_poly(PackedVector2Array([
			Vector2(x - 16, BOUNDS.position.y), Vector2(x + 16, BOUNDS.position.y), Vector2(x, BOUNDS.position.y + rng.randf_range(28.0, 78.0))
		]), Color(0.35, 0.36, 0.4, 0.9))
		_decorations.add_child(stal_top)
		var stal_bottom := _make_poly(PackedVector2Array([
			Vector2(x - 14, BOUNDS.end.y), Vector2(x + 14, BOUNDS.end.y), Vector2(x, BOUNDS.end.y - rng.randf_range(24.0, 72.0))
		]), Color(0.3, 0.31, 0.36, 0.95))
		_decorations.add_child(stal_bottom)

	for i in 8:
		var crystal := _make_poly(PackedVector2Array([
			Vector2(0, -24), Vector2(16, -8), Vector2(10, 18), Vector2(-10, 18), Vector2(-16, -8)
		]), Color(0.45, 0.85, 1.0, 0.65))
		crystal.position = Vector2(rng.randf_range(BOUNDS.position.x + 80.0, BOUNDS.end.x - 80.0), rng.randf_range(BOUNDS.position.y + 80.0, BOUNDS.end.y - 70.0))
		_decorations.add_child(crystal)
		if i == 0:
			_shimmer_node = crystal
			_base_shimmer_color = crystal.color

func _build_house_background(level_key: String) -> void:
	_clear_decorations()
	_ground.color = Color("4f8f4a")
	var rng := _rng_for(level_key, "house")

	var path := _make_poly(PackedVector2Array([
		Vector2(-45, BOUNDS.end.y), Vector2(45, BOUNDS.end.y), Vector2(92, 160), Vector2(-92, 160)
	]), Color(0.78, 0.72, 0.62, 0.95))
	_decorations.add_child(path)

	var house_body := _make_poly(PackedVector2Array([
		Vector2(220, -90), Vector2(470, -90), Vector2(470, 100), Vector2(220, 100)
	]), Color(0.95, 0.85, 0.72, 1.0))
	_decorations.add_child(house_body)
	var roof := _make_poly(PackedVector2Array([
		Vector2(190, -90), Vector2(345, -215), Vector2(500, -90)
	]), Color(0.72, 0.28, 0.22, 1.0))
	_decorations.add_child(roof)
	var door := _make_poly(PackedVector2Array([
		Vector2(325, 8), Vector2(370, 8), Vector2(370, 100), Vector2(325, 100)
	]), Color(0.47, 0.31, 0.22, 1.0))
	_decorations.add_child(door)
	var win1 := _make_poly(PackedVector2Array([
		Vector2(248, -35), Vector2(292, -35), Vector2(292, 10), Vector2(248, 10)
	]), Color(0.65, 0.87, 1.0, 0.9))
	_decorations.add_child(win1)
	var win2 := _make_poly(PackedVector2Array([
		Vector2(395, -35), Vector2(439, -35), Vector2(439, 10), Vector2(395, 10)
	]), Color(0.65, 0.87, 1.0, 0.9))
	_decorations.add_child(win2)

	for i in 10:
		var bush := _make_ellipse_node(Vector2(rng.randf_range(22.0, 44.0), rng.randf_range(14.0, 22.0)), Color(0.23, 0.58, 0.29, 0.9))
		bush.position = _edge_position(rng, 18.0, 56.0)
		_decorations.add_child(bush)

	for i in 6:
		var flower := _make_ellipse_node(Vector2(8.0, 8.0), Color(0.97, 0.52, 0.62, 0.95))
		flower.position = Vector2(rng.randf_range(-240.0, 180.0), rng.randf_range(70.0, 240.0))
		_decorations.add_child(flower)

	var smoke := _make_ellipse_node(Vector2(20.0, 13.0), Color(0.92, 0.95, 1.0, 0.3))
	smoke.position = Vector2(390, -245)
	_decorations.add_child(smoke)
	_shimmer_node = smoke
	_base_shimmer_color = smoke.color

func _build_trick_or_treat_background(level_key: String) -> void:
	_clear_decorations()
	_ground.color = Color("1b2535")
	var rng := _rng_for(level_key, "trick_or_treat")

	var moon := _make_ellipse_node(Vector2(42.0, 42.0), Color(0.95, 0.93, 0.72, 0.8))
	moon.position = Vector2(-420, -235)
	_decorations.add_child(moon)
	_shimmer_node = moon
	_base_shimmer_color = moon.color

	var road := _make_poly(PackedVector2Array([
		Vector2(BOUNDS.position.x, 45), Vector2(BOUNDS.end.x, 45), Vector2(BOUNDS.end.x, 210), Vector2(BOUNDS.position.x, 210)
	]), Color(0.18, 0.2, 0.24, 0.95))
	_decorations.add_child(road)

	var center_line := _make_poly(PackedVector2Array([
		Vector2(BOUNDS.position.x, 122), Vector2(BOUNDS.end.x, 122), Vector2(BOUNDS.end.x, 132), Vector2(BOUNDS.position.x, 132)
	]), Color(0.88, 0.78, 0.38, 0.65))
	_decorations.add_child(center_line)

	for i in 6:
		var x := -510.0 + (i * 190.0)
		_add_neighborhood_house(Vector2(x, -50), rng)

	for i in 10:
		var pumpkin := _make_pumpkin()
		pumpkin.position = Vector2(rng.randf_range(BOUNDS.position.x + 40.0, BOUNDS.end.x - 40.0), rng.randf_range(220.0, BOUNDS.end.y - 18.0))
		_decorations.add_child(pumpkin)

	for i in 10:
		var fence := _make_poly(PackedVector2Array([
			Vector2(-14, 0), Vector2(14, 0), Vector2(14, 18), Vector2(-14, 18)
		]), Color(0.6, 0.62, 0.66, 0.8))
		fence.position = Vector2(rng.randf_range(BOUNDS.position.x + 20.0, BOUNDS.end.x - 20.0), 198 + (i % 2) * 28)
		_decorations.add_child(fence)

	for i in 5:
		var bat := _make_bat_silhouette()
		bat.position = Vector2(rng.randf_range(BOUNDS.position.x + 80.0, BOUNDS.end.x - 80.0), rng.randf_range(BOUNDS.position.y + 30.0, -120.0))
		_decorations.add_child(bat)
		_add_sway(bat, rng, 0.008, 0.02)

func _add_neighborhood_house(pos: Vector2, rng: RandomNumberGenerator) -> void:
	var base := _make_poly(PackedVector2Array([
		Vector2(-46, -22), Vector2(46, -22), Vector2(46, 46), Vector2(-46, 46)
	]), Color(0.52, 0.42, 0.4, 1.0))
	base.position = pos
	_decorations.add_child(base)

	var roof := _make_poly(PackedVector2Array([
		Vector2(-58, -22), Vector2(0, -64), Vector2(58, -22)
	]), Color(0.31, 0.19, 0.19, 1.0))
	roof.position = pos
	_decorations.add_child(roof)

	var door := _make_poly(PackedVector2Array([
		Vector2(-10, 8), Vector2(10, 8), Vector2(10, 46), Vector2(-10, 46)
	]), Color(0.24, 0.16, 0.12, 1.0))
	door.position = pos
	_decorations.add_child(door)

	var win_color := Color(1.0, 0.76 + rng.randf_range(-0.08, 0.08), 0.34, 0.82)
	var win1 := _make_poly(PackedVector2Array([
		Vector2(-36, -10), Vector2(-18, -10), Vector2(-18, 8), Vector2(-36, 8)
	]), win_color)
	win1.position = pos
	_decorations.add_child(win1)
	var win2 := _make_poly(PackedVector2Array([
		Vector2(18, -10), Vector2(36, -10), Vector2(36, 8), Vector2(18, 8)
	]), win_color)
	win2.position = pos
	_decorations.add_child(win2)

func _make_pumpkin() -> Node2D:
	var root := Node2D.new()
	root.add_child(_make_ellipse_node(Vector2(12.0, 10.0), Color(0.95, 0.46, 0.14, 0.95)))
	var stem := _make_poly(PackedVector2Array([
		Vector2(-2, -13), Vector2(2, -13), Vector2(2, -8), Vector2(-2, -8)
	]), Color(0.34, 0.56, 0.22, 0.95))
	root.add_child(stem)
	return root

func _make_bat_silhouette() -> Polygon2D:
	return _make_poly(PackedVector2Array([
		Vector2(-16, 0), Vector2(-28, -6), Vector2(-20, 7), Vector2(-8, 2),
		Vector2(0, -5), Vector2(8, 2), Vector2(20, 7), Vector2(28, -6), Vector2(16, 0), Vector2(0, 8)
	]), Color(0.08, 0.08, 0.12, 0.9))

func _make_tree(scale_factor: float, leaf: Color, leaf_dark: Color, trunk: Color) -> Node2D:
	var root := Node2D.new()
	root.scale = Vector2(scale_factor, scale_factor)
	var trunk_shape := _make_poly(PackedVector2Array([
		Vector2(-4, -2), Vector2(4, -2), Vector2(5, 16), Vector2(-5, 16)
	]), trunk)
	root.add_child(trunk_shape)
	var canopy_back := _make_ellipse_node(Vector2(17.0, 14.0), leaf_dark)
	canopy_back.position = Vector2(0, -12)
	root.add_child(canopy_back)
	var canopy_front := _make_ellipse_node(Vector2(14.0, 12.0), leaf)
	canopy_front.position = Vector2(0, -15)
	root.add_child(canopy_front)
	return root

func _make_palm_tree(scale_factor: float) -> Node2D:
	var root := Node2D.new()
	root.scale = Vector2(scale_factor, scale_factor)
	var trunk := _make_poly(PackedVector2Array([
		Vector2(-3, -2), Vector2(3, -2), Vector2(7, 22), Vector2(-7, 22)
	]), Color(0.62, 0.46, 0.26, 1.0))
	root.add_child(trunk)
	for i in 6:
		var frond := _make_poly(PackedVector2Array([
			Vector2(0, -8), Vector2(26, -2), Vector2(18, 8), Vector2(0, 1)
		]), Color(0.24, 0.66, 0.36, 1.0))
		frond.rotation = deg_to_rad(-70 + i * 28)
		root.add_child(frond)
	return root

func _make_cactus(scale_factor: float) -> Node2D:
	var root := Node2D.new()
	root.scale = Vector2(scale_factor, scale_factor)
	root.add_child(_make_poly(PackedVector2Array([
		Vector2(-7, -18), Vector2(7, -18), Vector2(7, 18), Vector2(-7, 18)
	]), Color(0.2, 0.54, 0.34, 1.0)))
	root.add_child(_make_poly(PackedVector2Array([
		Vector2(7, -8), Vector2(16, -8), Vector2(16, 0), Vector2(7, 0)
	]), Color(0.2, 0.54, 0.34, 1.0)))
	root.add_child(_make_poly(PackedVector2Array([
		Vector2(-16, 2), Vector2(-7, 2), Vector2(-7, 10), Vector2(-16, 10)
	]), Color(0.2, 0.54, 0.34, 1.0)))
	return root

func _make_poly(points: PackedVector2Array, color: Color) -> Polygon2D:
	var p := Polygon2D.new()
	p.polygon = points
	p.color = color
	return p

func _make_ellipse_node(radii: Vector2, color: Color) -> Polygon2D:
	var p := Polygon2D.new()
	p.polygon = _oval_points(radii.x, radii.y, 12)
	p.color = color
	return p

func _make_oval_patch(rng: RandomNumberGenerator, color: Color) -> Polygon2D:
	var patch := Polygon2D.new()
	patch.color = color
	patch.position = Vector2(
		rng.randf_range(BOUNDS.position.x + 50.0, BOUNDS.end.x - 50.0),
		rng.randf_range(BOUNDS.position.y + 50.0, BOUNDS.end.y - 50.0)
	)
	patch.polygon = _oval_points(rng.randf_range(22.0, 54.0), rng.randf_range(14.0, 30.0), 10)
	return patch

func _add_sway(node: Node2D, rng: RandomNumberGenerator, min_amp: float = 0.01, max_amp: float = 0.028) -> void:
	_sway_nodes.append({
		"node": node,
		"phase": rng.randf_range(0.0, TAU),
		"speed": rng.randf_range(0.75, 1.3),
		"amp": rng.randf_range(min_amp, max_amp)
	})

func _edge_position(rng: RandomNumberGenerator, edge_min: float, edge_max: float) -> Vector2:
	var side := rng.randi_range(0, 3)
	match side:
		0:
			return Vector2(rng.randf_range(BOUNDS.position.x + 20.0, BOUNDS.end.x - 20.0), BOUNDS.position.y + rng.randf_range(edge_min, edge_max))
		1:
			return Vector2(rng.randf_range(BOUNDS.position.x + 20.0, BOUNDS.end.x - 20.0), BOUNDS.end.y - rng.randf_range(edge_min, edge_max))
		2:
			return Vector2(BOUNDS.position.x + rng.randf_range(edge_min, edge_max), rng.randf_range(BOUNDS.position.y + 20.0, BOUNDS.end.y - 20.0))
		_:
			return Vector2(BOUNDS.end.x - rng.randf_range(edge_min, edge_max), rng.randf_range(BOUNDS.position.y + 20.0, BOUNDS.end.y - 20.0))

func _rng_for(level_key: String, salt: String) -> RandomNumberGenerator:
	var rng := RandomNumberGenerator.new()
	rng.seed = int((level_key + ":" + salt).hash())
	return rng

func _oval_points(rx: float, ry: float, segments: int) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in segments:
		var t := TAU * float(i) / float(segments)
		pts.append(Vector2(cos(t) * rx, sin(t) * ry))
	return pts

func _river_polygon(level_key: String) -> PackedVector2Array:
	match level_key:
		"rainbow":
			return PackedVector2Array([
				Vector2(-560, -190), Vector2(-360, -120), Vector2(-120, -155),
				Vector2(120, -95), Vector2(360, -135), Vector2(560, -80),
				Vector2(560, 10), Vector2(360, -35), Vector2(110, 15),
				Vector2(-120, -35), Vector2(-360, 0), Vector2(-560, -65)
			])
		"numbers":
			return PackedVector2Array([
				Vector2(-560, 40), Vector2(-340, 95), Vector2(-110, 70),
				Vector2(130, 120), Vector2(360, 85), Vector2(560, 150),
				Vector2(560, 245), Vector2(360, 185), Vector2(140, 225),
				Vector2(-120, 175), Vector2(-350, 200), Vector2(-560, 140)
			])
		_:
			return PackedVector2Array([
				Vector2(-560, -10), Vector2(-320, 55), Vector2(-110, 15),
				Vector2(120, 75), Vector2(350, 20), Vector2(560, 85),
				Vector2(560, 180), Vector2(350, 120), Vector2(130, 170),
				Vector2(-100, 110), Vector2(-340, 150), Vector2(-560, 90)
			])

func _river_highlight_polygon(level_key: String) -> PackedVector2Array:
	match level_key:
		"rainbow":
			return PackedVector2Array([
				Vector2(-560, -145), Vector2(-360, -90), Vector2(-120, -125),
				Vector2(120, -65), Vector2(360, -105), Vector2(560, -55),
				Vector2(560, -30), Vector2(360, -75), Vector2(120, -35),
				Vector2(-120, -95), Vector2(-360, -55), Vector2(-560, -95)
			])
		"numbers":
			return PackedVector2Array([
				Vector2(-560, 95), Vector2(-340, 145), Vector2(-120, 120),
				Vector2(130, 165), Vector2(360, 130), Vector2(560, 195),
				Vector2(560, 210), Vector2(360, 155), Vector2(130, 195),
				Vector2(-120, 145), Vector2(-350, 170), Vector2(-560, 115)
			])
		_:
			return PackedVector2Array([
				Vector2(-560, 35), Vector2(-320, 100), Vector2(-110, 60),
				Vector2(120, 115), Vector2(350, 65), Vector2(560, 130),
				Vector2(560, 145), Vector2(350, 90), Vector2(130, 140),
				Vector2(-100, 80), Vector2(-340, 120), Vector2(-560, 65)
			])

func _color_for_item(item: String) -> Color:
	var rainbow := {
		"Red": Color("ff4d4d"),
		"Orange": Color("ff9f40"),
		"Yellow": Color("ffe066"),
		"Green": Color("6bd66b"),
		"Blue": Color("5ba8ff"),
		"Indigo": Color("7a6bff"),
		"Violet": Color("b46bff")
	}
	if rainbow.has(item):
		return rainbow[item]
	if item.is_valid_int():
		return Color(0.75, 1.0, 0.75)
	return Color(1.0, 0.95, 0.6)
