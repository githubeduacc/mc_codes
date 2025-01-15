const express = require("express");
const fs = require("fs");
const nodemailer = require("nodemailer");
const axios = require("axios");

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;
const emailHost = process.env.EMAIL_HOST;
const emailPort = process.env.EMAIL_PORT;
const senderAddress = process.env.SENDER_ADDRESS;
const receiverAddress = process.env.RECEIVER_ADDRESS;
const emailsEnabled = Boolean(process.env.EMAILS_ENABLED);

const qtys = [70, 50, 30, 20];
const logColors = {
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
};
const qtyColors = {
	70: logColors.magenta,
	50: logColors.cyan,
	30: logColors.yellow,
	20: logColors.green,
};

const app = express();

const sendEmail = async ({ code, qty, isEnabled }) => {
	let transporter = nodemailer.createTransport({
		host: emailHost,
		port: emailPort,
		auth: {
			user: emailUser,
			pass: emailPassword,
		},
	});

	const variables = {
		success: {
			subject: `¡Nuevo código de ${qty}% de descuento para McDonald's!`,
			text: `Tu código para tu nuevo voto es: ${code}`,
			html: `<h3>¡Se ha encontrado un nuevo código de ${qty}% de descuento para McDonald's!</h3>
			</br>
			<p>El código es: <strong>${code}</strong></p>
            </br>
            ${
							isEnabled
								? "<p><strong>El código está habilitado.</strong></p>"
								: "<p><strong>El código no está habilitado.</strong></p>"
						}
            </br>               
			<p>Email enviado automaticamente, no responder.</p>
			`,
		},
	};

	try {
		await transporter.sendMail({
			from: `Códigos Mc Donald's <${senderAddress}>`,
			to: receiverAddress,
			subject: variables["success"].subject,
			text: variables["success"].text,
			html: variables["success"].html,
		});
	} catch (error) {
		console.log(error);
	}
};

const generateCode = (qty) => {
	// format: QTYOFFXXXXX (QTY is two digit (20-30-40-50-60-70), X is a random character from A-Z or number from 0-9)
	const code =
		qty.toString() +
		"OFF" +
		Math.random().toString(36).substring(2, 7).toUpperCase();
	return code;
};

const generateAndCheckCode = async (qty) => {
	const code = generateCode(qty);

	try {
		const response = await axios.post(
			"https://promos-mcd-ecommerce.appmcdonalds.com/api/promotions/check-code",
			{
				coupon: code,
			},
			{
				headers: {
					accept: "application/json, text/plain, */*",
					"accept-language": "en-US,en;q=0.6",
					"content-type": "application/json",
					priority: "u=1, i",
					"sec-ch-ua":
						'"Brave";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
					"sec-ch-ua-mobile": "?0",
					"sec-ch-ua-platform": '"Windows"',
					"sec-fetch-dest": "empty",
					"sec-fetch-mode": "cors",
					"sec-fetch-site": "cross-site",
					"sec-gpc": "1",
					"x-app-country": "AR",
					"x-app-version": "web-2.0.0",
				},
				referrerPolicy: "same-origin",
			}
		);
		try {
			const data = await response.data;
			const isValid = data.valid;
			const isEnabled = data.enabled;

			if (isValid) {
				// save the code to a file
				fs.appendFileSync(
					qty + "off.txt",
					code + " ENABLED: " + isEnabled + "\n"
				);

				if (qty === 70 || qty === 50) {
					console.log(
						`${qtyColors[qty]} VALID ${qty}% OFF CODE: ${code} ENABLED: ${isEnabled}!!! ${qtyColors[qty]}`
					);

					emailsEnabled &&
						sendEmail({
							code: code,
							qty: qty,
							isEnabled: isEnabled,
						});
				} else {
					console.log(
						`${qtyColors[qty]} Valid ${qty}% off code: ${code} ENABLED: ${isEnabled} ${qtyColors[qty]}`
					);
				}
			}
		} catch (error) {
			console.log(error);
		}
	} catch (error) {
		console.log(error);
	}
};

setInterval(() => {
	qtys.forEach((qty) => {
		generateAndCheckCode(qty);
	});
}, 100);

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
