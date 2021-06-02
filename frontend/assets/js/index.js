$(function () {
	const io = window.io
	const socket = io("ws://localhost:3000/", {
		transports: ["websocket"],
	})
	socket.on("connect", () => {
		console.log("Connected")
	})

	socket.on("connect_error", (error) => {
		console.log(error)
	})

	socket.on("disconnect", (reason) => {
		console.log(reason)
	})

	// $(".app").load("nickname.html", function () {
	// 	$(".btn-submit").click(function (e) {
	// 		e.preventDefault()
	// 		localStorage.setItem("nickname", $("#nickname").val())

	// })

	$(".app").load("room.html", function () {
		$(".create-room").click(function () {
			socket.emit("create_room", { nickname: "home" })
			window.localStorage.setItem("status", "home")
			toMatch()
		})

		$(".btn-join").click(function () {
			socket.emit("join_room", {
				room_number: $("#room_id").val(),
				nickname: "visitor",
			})
			window.localStorage.setItem("status", "visitor")
			toMatch()
		})
	})

	// MATCH
	const toMatch = () => {
		$(".app").load("match.html", function () {
			let option = `
                <span class='choice-title'>Choose wisely</span>
                <div class='choices'>
                    <div class='choice' id='r' data-choice="stone">
                        <img src='https://goodday451999.github.io/Rock-Paper-Scissors-Neo/images/stone.png' alt="it's a rock" />
                    </div>
                    <div class='choice' id='p' data-choice="paper">
                        <img src='https://goodday451999.github.io/Rock-Paper-Scissors-Neo/images/paper.png' alt="it's a paper" />
                    </div>
                    <div class='choice' id='s' data-choice="scissors">
                        <img
                            src='https://goodday451999.github.io/Rock-Paper-Scissors-Neo/images/scissors.png'
                            alt="it's a scissors"
                        />
                    </div>
                </div>
            `

			socket.on("emit_room", (e) => {
				console.log(e)
				if (
					window.localStorage.getItem("status") === "home" &&
					!e?.home?.state
				) {
					$(".player-1 .bottom").html(option)
				} else {
					$(".player-1 .bottom").html("<span class='text'>Please Wait</span>")
				}

				if (
					window.localStorage.getItem("status") === "visitor" &&
					!e?.visitor?.state
				) {
					$(".player-2 .bottom").html(option)
				} else {
					$(".player-2 .bottom").html("<span class='text'>Please Wait</span>")
				}

				$(".roomid").html(e.room_number)
				$(".score span:first").html(e?.home?.point)
				$(".score span:last").html(e?.visitor?.point)
				$(".player-1 .chosen").html(
					`<img alt='' src='https://goodday451999.github.io/Rock-Paper-Scissors-Neo/images/${
						e?.winner && e?.home?.state
					}.png'} />`
				)
				$(".player-2 .chosen").html(
					`<img alt='' src='https://goodday451999.github.io/Rock-Paper-Scissors-Neo/images/${
						e?.winner && e?.visitor?.state
					}.png'} />`
				)
				$(".player .choice").click(function (e) {
					let val = $(this).data("choice")
					socket.emit("play", { chosen: val })
				})
			})
		})
	}
})
