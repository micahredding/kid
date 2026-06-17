extends CharacterBody2D

@export var speed: float = 180.0
@export var display_name: String = "Mommy"
@export_enum("mommy", "daddy", "bat", "skeleton") var look_type: String = "mommy"
@export var body_color: Color = Color(1.0, 0.65, 0.75)

@onready var _torso: Polygon2D = $Torso
@onready var _head: Polygon2D = $Head
@onready var _hair: Polygon2D = $Hair
@onready var _eye_left: Polygon2D = $EyeLeft
@onready var _eye_right: Polygon2D = $EyeRight
@onready var _glasses: Node2D = $Glasses
@onready var _bat_wings: Node2D = $BatWings
@onready var _skeleton_bits: Node2D = $SkeletonBits
@onready var _label: Label = $NameLabel

var _target := Vector2.ZERO
var _has_target := false

func _ready() -> void:
	# Followers are visual companions and should never block the player.
	collision_layer = 0
	collision_mask = 0
	_apply_look()
	_label.text = display_name

func refresh_appearance() -> void:
	_apply_look()
	_label.text = display_name

func _apply_look() -> void:
	_torso.color = body_color
	_head.color = Color(1.0, 0.88, 0.74)
	_eye_left.color = Color(0.08, 0.08, 0.08)
	_eye_right.color = Color(0.08, 0.08, 0.08)
	_head.visible = true
	_torso.visible = true
	_hair.visible = true
	_bat_wings.visible = false
	_skeleton_bits.visible = false
	_glasses.visible = false

	if look_type == "daddy":
		_hair.color = Color(0.44, 0.28, 0.16)
		_glasses.visible = true
	elif look_type == "bat":
		_torso.color = Color(0.22, 0.2, 0.32)
		_head.color = Color(0.22, 0.2, 0.32)
		_hair.visible = false
		_bat_wings.visible = true
		_eye_left.color = Color(1.0, 0.22, 0.22)
		_eye_right.color = Color(1.0, 0.22, 0.22)
	elif look_type == "skeleton":
		_torso.color = Color(0.88, 0.88, 0.88)
		_head.color = Color(0.9, 0.9, 0.9)
		_hair.visible = false
		_skeleton_bits.visible = true
	else:
		_hair.color = Color(0.95, 0.42, 0.22)

func set_follow_target(target: Vector2, player_pos: Vector2) -> void:
	_target = target
	_has_target = true
	if global_position.distance_to(player_pos) > 700.0:
		global_position = player_pos + Vector2(randf_range(-90.0, 90.0), randf_range(-90.0, 90.0))

func _physics_process(_delta: float) -> void:
	if not _has_target:
		velocity = Vector2.ZERO
		return

	var delta_vec := _target - global_position
	if delta_vec.length() < 6.0:
		velocity = Vector2.ZERO
	else:
		velocity = delta_vec.normalized() * speed

	move_and_slide()
