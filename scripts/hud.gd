extends CanvasLayer

signal back_requested

@onready var _mode_label: Label = $UI/Panel/VBox/ModeLabel
@onready var _progress_label: Label = $UI/Panel/VBox/ProgressLabel
@onready var _alphabet_grid: GridContainer = $UI/Panel/VBox/TrackArea/AlphabetGrid
@onready var _rainbow_box: VBoxContainer = $UI/Panel/VBox/TrackArea/RainbowBox
@onready var _rainbow_display = $UI/Panel/VBox/TrackArea/RainbowBox/RainbowDisplay
@onready var _rainbow_legend: HBoxContainer = $UI/Panel/VBox/TrackArea/RainbowBox/RainbowLegend
@onready var _generic_flow: FlowContainer = $UI/Panel/VBox/TrackArea/GenericFlow
@onready var _complete_label: Label = $UI/Panel/VBox/CompleteLabel
@onready var _back_button: Button = $UI/BackButton

var _mode: String = ""
var _items: Array[String] = []
var _found: Dictionary = {}
var _chips: Dictionary = {}
var _emoji_map: Dictionary = {}
var _symbol_map: Dictionary = {}

func _ready() -> void:
	_back_button.pressed.connect(func() -> void: emit_signal("back_requested"))

func setup(mode: String, items: Array[String], title: String, config: Dictionary = {}) -> void:
	_mode = mode
	_items = items.duplicate()
	_found.clear()
	_chips.clear()
	_emoji_map = config.get("emoji_map", {})
	_symbol_map = config.get("symbol_map", {})

	_mode_label.text = title
	_progress_label.text = "0 / %d" % _items.size()
	_complete_label.visible = false

	_clear_children(_alphabet_grid)
	_clear_children(_generic_flow)
	_clear_children(_rainbow_legend)

	_alphabet_grid.visible = false
	_rainbow_box.visible = false
	_generic_flow.visible = false

	if _mode == "letters":
		_build_alphabet_tiles()
		_alphabet_grid.visible = true
	elif _mode == "rainbow":
		_build_rainbow_legend()
		_rainbow_box.visible = true
		_rainbow_display.setup(_items)
	else:
		_build_generic_tiles()
		_generic_flow.visible = true

func mark_collected(item: String) -> void:
	_found[item] = true
	_progress_label.text = "%d / %d" % [_found.size(), _items.size()]

	if _chips.has(item):
		_set_chip_found(_chips[item], item)

	if _mode == "rainbow":
		_rainbow_display.mark_collected(item)

func show_complete() -> void:
	_complete_label.visible = true
	_complete_label.text = "You did it!"

func _build_alphabet_tiles() -> void:
	for item in _items:
		var tile := _make_chip(item, 36, Color(0.15, 0.15, 0.15), Color(1.0, 1.0, 1.0, 0.35), Vector2(56, 52))
		_alphabet_grid.add_child(tile)
		_chips[item] = tile
		_set_chip_missing(tile)

func _build_generic_tiles() -> void:
	for item in _items:
		var display_text: String = _chip_text(item)
		var style_bg: Color = _chip_bg_color(item)
		var style_font: Color = _chip_font_color(style_bg)
		var tile := _make_chip(display_text, _chip_font_size(), style_font, style_bg, _chip_size())
		tile.tooltip_text = item
		_generic_flow.add_child(tile)
		_chips[item] = tile
		_set_chip_missing(tile)

func _build_rainbow_legend() -> void:
	for item in _items:
		var tile := _make_chip(item, 18, Color(1.0, 1.0, 1.0), _rainbow_color(item), Vector2(96, 36))
		_rainbow_legend.add_child(tile)
		_chips[item] = tile
		_set_chip_missing(tile)

func _chip_text(item: String) -> String:
	if _mode == "words_emoji":
		return str(_emoji_map.get(item, item))
	if _mode == "animals" and _emoji_map.has(item):
		return "%s %s" % [str(_emoji_map[item]), item]
	if _mode == "shapes" and _symbol_map.has(item):
		return "%s %s" % [str(_symbol_map[item]), item]
	return item

func _chip_font_size() -> int:
	if _mode == "words_emoji":
		return 44
	if _mode == "numbers":
		return 32
	if _mode == "animals":
		return 24
	if _mode == "shapes":
		return 24
	return 26

func _chip_size() -> Vector2:
	if _mode == "words_emoji":
		return Vector2(90, 86)
	if _mode == "numbers":
		return Vector2(76, 56)
	if _mode == "animals":
		return Vector2(150, 52)
	if _mode == "shapes":
		return Vector2(166, 52)
	return Vector2(86, 58)

func _chip_bg_color(item: String) -> Color:
	if _mode == "words_emoji":
		return Color(0.26, 0.34, 0.62, 0.9)
	if _mode == "animals":
		return Color(0.19, 0.48, 0.38, 0.9)
	if _mode == "shapes":
		return Color(0.53, 0.34, 0.19, 0.9)
	if _mode == "numbers":
		return Color(0.22, 0.46, 0.62, 0.9)
	return Color(0.45, 0.45, 0.45, 0.9)

func _chip_font_color(bg: Color) -> Color:
	var luma: float = (0.299 * bg.r) + (0.587 * bg.g) + (0.114 * bg.b)
	if luma > 0.62:
		return Color(0.1, 0.1, 0.1)
	return Color(1.0, 1.0, 1.0)

func _make_chip(text: String, font_size: int, font_color: Color, bg_color: Color, min_size: Vector2) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = min_size

	var style := StyleBoxFlat.new()
	style.bg_color = bg_color
	style.corner_radius_top_left = 10
	style.corner_radius_top_right = 10
	style.corner_radius_bottom_right = 10
	style.corner_radius_bottom_left = 10
	style.border_width_left = 2
	style.border_width_top = 2
	style.border_width_right = 2
	style.border_width_bottom = 2
	style.border_color = Color(1.0, 1.0, 1.0, 0.7)
	panel.add_theme_stylebox_override("panel", style)

	var label := Label.new()
	label.text = text
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", font_color)
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.size_flags_vertical = Control.SIZE_EXPAND_FILL
	panel.add_child(label)

	return panel

func _set_chip_missing(chip: PanelContainer) -> void:
	chip.modulate = Color(0.62, 0.62, 0.62, 0.5)

func _set_chip_found(chip: PanelContainer, item: String) -> void:
	chip.modulate = Color(1.0, 1.0, 1.0, 1.0)
	if _mode == "rainbow":
		var style = chip.get_theme_stylebox("panel")
		if style is StyleBoxFlat:
			style.bg_color = _rainbow_color(item)

func _rainbow_color(item: String) -> Color:
	match item:
		"Red":
			return Color("ff4d4d")
		"Orange":
			return Color("ff9f40")
		"Yellow":
			return Color("ffe066")
		"Green":
			return Color("6bd66b")
		"Blue":
			return Color("5ba8ff")
		"Indigo":
			return Color("7a6bff")
		"Violet":
			return Color("b46bff")
		_:
			return Color(0.9, 0.9, 0.9)

func _clear_children(node: Node) -> void:
	for child in node.get_children():
		child.queue_free()
