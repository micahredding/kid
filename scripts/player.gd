extends CharacterBody2D

signal position_sampled(pos: Vector2)

@export var speed: float = 230.0
@export_enum("normal", "ghost") var look_type: String = "normal"

@onready var _torso: Polygon2D = $Torso
@onready var _head: Polygon2D = $Head
@onready var _hair: Polygon2D = $Hair
@onready var _eye_left: Polygon2D = $EyeLeft
@onready var _eye_right: Polygon2D = $EyeRight
@onready var _ghost_body: Polygon2D = $GhostBody
@onready var _ghost_eye_left: Polygon2D = $GhostEyeLeft
@onready var _ghost_eye_right: Polygon2D = $GhostEyeRight

var _sample_timer := 0.0

func _ready() -> void:
	add_to_group("player")
	_apply_look()
	emit_signal("position_sampled", global_position)

func refresh_appearance() -> void:
	_apply_look()

func _apply_look() -> void:
	var ghost_mode := look_type == "ghost"
	_torso.visible = not ghost_mode
	_head.visible = not ghost_mode
	_hair.visible = not ghost_mode
	_eye_left.visible = not ghost_mode
	_eye_right.visible = not ghost_mode

	_ghost_body.visible = ghost_mode
	_ghost_eye_left.visible = ghost_mode
	_ghost_eye_right.visible = ghost_mode

func _physics_process(delta: float) -> void:
	var dir := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	velocity = dir * speed
	move_and_slide()

	_sample_timer += delta
	if _sample_timer >= 0.05:
		_sample_timer = 0.0
		emit_signal("position_sampled", global_position)
