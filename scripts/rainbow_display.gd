extends Control

var _items: Array[String] = []
var _found: Dictionary = {}

func setup(items: Array[String]) -> void:
	_items = items.duplicate()
	_found.clear()
	queue_redraw()

func mark_collected(item: String) -> void:
	_found[item] = true
	queue_redraw()

func _draw() -> void:
	if _items.is_empty():
		return

	var center: Vector2 = Vector2(size.x * 0.5, size.y * 0.95)
	var base_radius: float = minf(size.x * 0.42, size.y * 0.88)
	var ring_width: float = 12.0
	var ring_gap: float = 4.0

	for i in _items.size():
		var item: String = _items[i]
		var color: Color = _color_for_item(item)
		if not _found.has(item):
			color = color.darkened(0.55)
			color.a = 0.35

		var radius: float = base_radius - (float(i) * (ring_width + ring_gap))
		if radius <= ring_width:
			continue
		draw_arc(center, radius, PI, TAU, 64, color, ring_width, true)

func _color_for_item(item: String) -> Color:
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
			return Color(1.0, 1.0, 1.0)
