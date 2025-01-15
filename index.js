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

const sendEmail = async ({ code, qty, type, validCodes, invalidCodes }) => {
	let transporter = nodemailer.createTransport({
		host: emailHost,
		port: emailPort,
		auth: {
			user: emailUser,
			pass: emailPassword,
		},
	});

	const variables = {
		codeFound: {
			subject: `¡Nuevo código de ${qty}% de descuento para McDonald's!`,
			text: `Tu código para tu nuevo voto es: ${code}`,
			html: `<h3>¡Se ha encontrado un nuevo código de ${qty}% de descuento para McDonald's!</h3>
			</br>
			<p>El código es: <strong>${code}</strong></p>
            </br>               
			<p>Email enviado automaticamente, no responder.</p>
			`,
		},
		checkedCodes: {
			subject: `Resumen de verificación de códigos de ${qty}% descuento de McDonald's`,
			text: `Resumen de verificación de códigos de ${qty}% descuento de McDonald's`,
			html: `<h3>Resumen de verificación de códigos de ${qty}% descuento de McDonald's</h3>
			</br>
			<p>Se han verificado los códigos de ${qty}% descuento de McDonald's y se han encontrado los siguientes resultados:</p>
			</br>
			<h4>Códigos válidos (${validCodes.length}):</h4>
			${
				validCodes.length > 0
					? "<ul>"
					: "<p>No se han encontrado códigos válidos</p>"
			}
			${validCodes.map((code) => `<li>${code}</li>`).join("")}
			${validCodes.length > 0 ? "</ul>" : ""}
			</br>
			<h4>Códigos inválidos (${invalidCodes.length}):</h4>
			${
				invalidCodes.length > 0
					? "<ul>"
					: "<p>No se han encontrado códigos inválidos</p>"
			}
			${invalidCodes.map((code) => `<li>${code}</li>`).join("")}
			${invalidCodes.length > 0 ? "</ul>" : ""}
			</br>
			<p>Email enviado automaticamente, no responder.</p>
			`,
		},
	};

	try {
		await transporter.sendMail({
			from: `Códigos Mc Donald's <${senderAddress}>`,
			to: receiverAddress,
			subject: variables[type].subject,
			text: variables[type].text,
			html: variables[type].html,
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

			if (isValid) {
				fs.appendFileSync(qty + "off.txt", code + "\n");

				if (qty === 70) {
					console.log(
						`${qtyColors[qty]} VALID ${qty}% OFF CODE: ${code}!!! ${qtyColors[qty]}`
					);

					emailsEnabled &&
						(await sendEmail({
							code: code,
							qty: qty,
							type: "codeFound",
							validCodes: [],
							invalidCodes: [],
						}));
				} else {
					console.log(
						`${qtyColors[qty]} Valid ${qty}% off code: ${code} ${qtyColors[qty]}`
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

const checkExistingCodes = async () => {
	let validCodes = [];
	let invalidCodes = [];
	let totalCodesChecked = 0;
	console.log("\nVerificando de códigos existentes...");

	await Promise.all(
		qtys.map(async (qty) => {
			try {
				const data = await fs.promises.readFile(qty + "off.txt", "utf8");
				const codes = data.split(/\r?\n/).filter((code) => code.trim());
				const invalidCodesForQty = [];
				const validCodesForQty = [];

				await Promise.all(
					codes.map(async (code) => {
						if (!code) return;
						const codeValue = code.trim();

						try {
							const response = await axios.post(
								"https://promos-mcd-ecommerce.appmcdonalds.com/api/promotions/check-code",
								{ coupon: codeValue },
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

							const data = response.data;
							const isValid = data.valid;
							const status = data.status;

							if (isValid) {
								validCodesForQty.push(codeValue);
								validCodes.push(codeValue);
							} else {
								invalidCodesForQty.push(codeValue);
								invalidCodes.push(codeValue);
								console.log(
									`${logColors.red} ${qty}% off code: ${codeValue} is not valid anymore. Status code: ${status} ${logColors.red}`
								);
							}
							totalCodesChecked++;
						} catch (error) {
							console.log(error);
						}
					})
				);

				if (invalidCodesForQty.length > 0) {
					await fs.promises.writeFile(
						qty + "off.txt",
						validCodesForQty.join("\n") + "\n"
					);
					await fs.promises.appendFile(
						"already_used.txt",
						invalidCodesForQty
							.map((code) => `${qty}% OFF CODE: ${code}`)
							.join("\n") + "\n"
					);
				}

				emailsEnabled &&
					invalidCodesForQty.length > 0 &&
					(await sendEmail({
						code: "",
						qty: qty,
						type: "checkedCodes",
						validCodes: validCodesForQty,
						invalidCodes: invalidCodesForQty,
					}));
			} catch (error) {
				console.log(error);
			}
		})
	);

	console.log("\n=== Resumen de verificación de códigos ===");
	console.log(
		`${logColors.yellow}Total de códigos verificados: ${totalCodesChecked}${logColors.yellow}`
	);
	console.log(
		`${logColors.green}Códigos válidos: ${validCodes.length}${logColors.green}`
	);
	console.log(
		`${logColors.red}Códigos inválidos: ${invalidCodes.length}${logColors.red}`
	);
	invalidCodes.length > 0 &&
		console.log(
			`${logColors.red}Códigos inválidos: ${invalidCodes.join(", ")}${
				logColors.red
			}`
		);
	console.log("=======================================\n");
};

let checkingCodes = false;

setInterval(() => {
	(async () => {
		if (checkingCodes) return;
		checkingCodes = true;
		await checkExistingCodes();
		checkingCodes = false;
	})();
}, 300000);

setInterval(() => {
	if (checkingCodes) return;
	qtys.forEach((qty) => {
		generateAndCheckCode(qty);
	});
}, 100);

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
