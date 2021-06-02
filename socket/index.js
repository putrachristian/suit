const express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)

const ROOM_NUMBER_STR = "room_number"
const PLAYER_JOIN_ROOM = "emit_room"
const PLAYER_LEAVE_ROOM = "emit_player_leave_room"
const PLAYER_PLAY = "emit_room"

const PLAYER_1_STR = "player_1"
const PLAYER_2_STR = "player_2"
const NICKNAME_STR = "nickname"

let roomList = {}
let roomNumberList = []
let playerList = {}

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/index.html")
})

io.on("connection", (socket) => {
	socket.on("disconnect", () => {
		// console.log(socket);
	})

	socket.on("create_room", (payload) => {
		try {
			let roomNumber = ""
			while (true) {
				roomNumber = ""
				for (let i = 0; i < 4; i++) {
					roomNumber += Math.floor(Math.random() * 10)
				}
				if (!roomNumberList.includes(roomNumber)) {
					break
				}
			}
			roomList[roomNumber] = {
				room_number: roomNumber,
				counter: 0,
				[payload[NICKNAME_STR]]: {
					// nickname: payload[NICKNAME_STR]
					point: 0,
				},
				// player_2: {
				//   nickname: null
				// }
			}
			playerList[socket.id] = {
				room_number: roomNumber,
				player: 1,
				nickname: payload[NICKNAME_STR],
			}
			socket.join(roomNumber)
			io.to(roomNumber).emit(PLAYER_JOIN_ROOM, roomList[roomNumber])
		} catch (ex) {
			socket.emit(PLAYER_JOIN_ROOM, { msg: "Invalid Params" })
		}
	})

	socket.on("leave_room", (payload) => {
		if (roomList[payload[ROOM_NUMBER_STR]] == null) {
			socket.emit(PLAYER_LEAVE_ROOM, false)
		} else {
			if (
				roomList[payload[ROOM_NUMBER_STR]][PLAYER_1_STR] ==
				payload[NICKNAME_STR]
			) {
				roomList[payload[ROOM_NUMBER_STR]][PLAYER_1_STR] = null
			} else {
				roomList[payload[ROOM_NUMBER_STR]][PLAYER_2_STR] = null
			}
			socket.leave(payload[ROOM_NUMBER_STR])
			io.to(payload[ROOM_NUMBER_STR]).emit(
				PLAYER_LEAVE_ROOM,
				payload[NICKNAME_STR]
			)
		}
	})

	socket.on("join_room", (payload) => {
		if (roomList[payload[ROOM_NUMBER_STR]] == null) {
			socket.emit(PLAYER_JOIN_ROOM, { msg: "Invalid Room Number" })
		} else {
			console.log(roomList[payload[ROOM_NUMBER_STR]])
			roomList[payload[ROOM_NUMBER_STR]][payload[NICKNAME_STR]] = {
				point: 0,
			}

			playerList[socket.id] = {
				room_number: payload[ROOM_NUMBER_STR],
				player: 2,
				nickname: payload[NICKNAME_STR],
			}
			socket.join(payload[ROOM_NUMBER_STR])
			io.to(payload[ROOM_NUMBER_STR]).emit(
				PLAYER_JOIN_ROOM,
				roomList[payload[ROOM_NUMBER_STR]]
			)
		}
	})

	socket.on("play", (payload) => {
		console.log(playerList[socket.id])
		let roomNumber = playerList[socket.id]["room_number"]
		let player = playerList[socket.id]["player"]
		let chosen = payload["chosen"]
		// console.log(playerList[socket.id])
		let nickname = playerList[socket.id]["nickname"]
		if (roomList[roomNumber][nickname]["state"] == null) {
			roomList[roomNumber]["counter"] += 1
		}

		roomList[roomNumber][nickname]["state"] = chosen
		console.log(roomList[roomNumber])
		if (roomList[roomNumber]["counter"] == 2) {
			let result = {
				paper: {
					stone: 1,
					scissors: -1,
					paper: 0,
				},
				stone: {
					stone: 0,
					scissors: 1,
					paper: -1,
				},
				scissors: {
					stone: -1,
					paper: 1,
					scissors: 0,
				},
			}
			let homeChosen = roomList[roomNumber]["home"]["state"]
			let visitorChosen = roomList[roomNumber]["visitor"]["state"]

			let res1 = result[homeChosen][visitorChosen]
			let res2 = {
				1: "home",
				"-1": "visitor",
				0: "Draw",
			}
			let res3 = res2[res1]
			roomList[roomNumber]["winner"] = res3
			if (res3 != "Draw") {
				roomList[roomNumber][res3]["point"] += 1
			}
			roomList[roomNumber]["counter"] = 0
			io.to(roomNumber).emit(PLAYER_PLAY, roomList[roomNumber])
			console.log(roomList[roomNumber])

			setTimeout(() => {
				roomList[roomNumber]["visitor"]["state"] = null
				roomList[roomNumber]["home"]["state"] = null
				roomList[roomNumber]["winner"] = null
				io.to(roomNumber).emit(PLAYER_PLAY, roomList[roomNumber])
			}, 2500)
			return
		}

		io.to(roomNumber).emit(PLAYER_PLAY, roomList[roomNumber])
	})
})

server.listen(8000, () => {
	console.log("listening on *:8000")
})
