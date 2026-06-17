extends Node2D

const LEVEL_DATA := preload("res://scripts/level_data.gd")

var _level_scene := preload("res://scenes/Level.tscn")
var _current_level = null

@onready var _menu_layer: CanvasLayer = $Menu
@onready var _level_buttons: VBoxContainer = $Menu/UI/Panel/VBox/LevelButtons

func _ready() -> void:
	_build_level_menu()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") and _current_level != null:
		_return_to_menu()

func _build_level_menu() -> void:
	for child in _level_buttons.get_children():
		child.queue_free()

	for level_key in LEVEL_DATA.LEVEL_ORDER:
		var level_info: Dictionary = LEVEL_DATA.LEVELS.get(level_key, {})
		if level_info.is_empty():
			continue
		_add_level_button(level_key, str(level_info.get("title", level_key.capitalize())))

func _add_level_button(level_key: String, label_text: String) -> void:
	var button := Button.new()
	button.text = label_text
	button.custom_minimum_size = Vector2(0, 44)
	button.pressed.connect(func() -> void: _start_level(level_key))
	_level_buttons.add_child(button)

func _start_level(level_key: String) -> void:
	if _current_level != null:
		_current_level.queue_free()

	_current_level = _level_scene.instantiate()
	add_child(_current_level)
	_current_level.exit_to_menu.connect(_return_to_menu)
	_current_level.setup_level(level_key)
	_menu_layer.visible = false

func _return_to_menu() -> void:
	if _current_level != null:
		_current_level.queue_free()
		_current_level = null
	_menu_layer.visible = true
