extends RefCounted
class_name LevelData

const LEVEL_ORDER: Array[String] = [
	"alphabet",
	"rainbow",
	"numbers",
	"simple_words",
	"shapes",
	"animals",
	"halloween"
]

const LEVELS := {
	"alphabet": {
		"title": "Alphabet Hunt",
		"mode": "letters",
		"map_theme": "forest",
		"items": [
			"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
			"N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
		]
	},
	"rainbow": {
		"title": "Rainbow Run",
		"mode": "rainbow",
		"map_theme": "island_chain",
		"items": ["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet"]
	},
	"numbers": {
		"title": "Count to 10",
		"mode": "numbers",
		"map_theme": "mountains",
		"items": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
	},
	"simple_words": {
		"title": "Simple Words",
		"mode": "words_emoji",
		"map_theme": "house",
		"items": ["cat", "hat", "dog", "sun", "car", "tree", "book", "ball"],
		"emoji_map": {
			"cat": "🐱",
			"hat": "🧢",
			"dog": "🐶",
			"sun": "☀️",
			"car": "🚗",
			"tree": "🌳",
			"book": "📘",
			"ball": "⚽"
		}
	},
	"shapes": {
		"title": "Shape Hunt",
		"mode": "shapes",
		"map_theme": "desert",
		"items": ["Circle", "Square", "Triangle", "Star", "Heart", "Diamond", "Oval", "Rectangle"],
		"symbol_map": {
			"Circle": "●",
			"Square": "■",
			"Triangle": "▲",
			"Star": "★",
			"Heart": "♥",
			"Diamond": "◆",
			"Oval": "⬭",
			"Rectangle": "▭"
		}
	},
	"animals": {
		"title": "Animal Hunt",
		"mode": "animals",
		"map_theme": "cave",
		"items": ["Cat", "Dog", "Bird", "Fish", "Duck", "Horse", "Frog", "Cow"],
		"emoji_map": {
			"Cat": "🐱",
			"Dog": "🐶",
			"Bird": "🐦",
			"Fish": "🐟",
			"Duck": "🦆",
			"Horse": "🐴",
			"Frog": "🐸",
			"Cow": "🐮"
		}
	},
	"halloween": {
		"title": "Halloween Trick-or-Treat",
		"mode": "words_emoji",
		"map_theme": "trick_or_treat",
		"char_styles": {
			"asher": "ghost",
			"mommy": "bat",
			"daddy": "skeleton"
		},
		"items": ["candy", "pumpkin", "ghost", "bat", "spider", "hat", "moon", "house"],
		"emoji_map": {
			"candy": "🍬",
			"pumpkin": "🎃",
			"ghost": "👻",
			"bat": "🦇",
			"spider": "🕷️",
			"hat": "🧙",
			"moon": "🌙",
			"house": "🏠"
		}
	}
}
