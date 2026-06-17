extends Area2D

signal collected(value: String)

@export var value: String = "A"
@export var tint: Color = Color(1.0, 1.0, 0.5)

@onready var _body: Polygon2D = $Body
@onready var _label: Label = $Label

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	_update_visuals()

func configure(new_value: String, new_tint: Color) -> void:
	value = new_value
	tint = new_tint
	if is_node_ready():
		_update_visuals()

func _update_visuals() -> void:
	_body.color = tint
	_label.text = value
	_label.add_theme_color_override("font_color", _text_color_for_background(tint))
	_label.add_theme_color_override("font_outline_color", Color(0.0, 0.0, 0.0, 0.7))
	_label.add_theme_constant_override("outline_size", 2)

func _text_color_for_background(bg: Color) -> Color:
	var luma := (0.299 * bg.r) + (0.587 * bg.g) + (0.114 * bg.b)
	if luma > 0.62:
		return Color(0.08, 0.08, 0.08)
	return Color(1.0, 1.0, 1.0)

func _on_body_entered(body: Node) -> void:
	if body.is_in_group("player"):
		emit_signal("collected", value)
		queue_free()
