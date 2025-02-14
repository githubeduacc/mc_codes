require("dotenv").config();

const express = require("express");
const fs = require("fs");
const nodemailer = require("nodemailer");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const PORT = process.env.PORT || 3000;
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;
const emailHost = process.env.EMAIL_HOST;
const emailPort = process.env.EMAIL_PORT;
const senderAddress = process.env.SENDER_ADDRESS;
const receiverAddress = process.env.RECEIVER_ADDRESS;
const emailsEnabled = process.env.EMAILS_ENABLED === "true";
const seventyOffGenEnabled = process.env.SEVENTY_GEN_ENABLED === "true";
const seventyOffCheckEnabled = process.env.SEVENTY_CHECK_ENABLED === "true";
const seventyOffGenNotifications =
	process.env.SEVENTY_GEN_NOTIFICATIONS === "true";
const seventyOffCheckNotifications =
	process.env.SEVENTY_CHECK_NOTIFICATIONS === "true";
const fiftyOffGenEnabled = process.env.FIFTY_GEN_ENABLED === "true";
const fiftyOffCheckEnabled = process.env.FIFTY_CHECK_ENABLED === "true";
const fiftyOffGenNotifications = process.env.FIFTY_GEN_NOTIFICATIONS === "true";
const fiftyOffCheckNotifications =
	process.env.FIFTY_CHECK_NOTIFICATIONS === "true";
const thirtyOffGenEnabled = process.env.THIRTY_GEN_ENABLED === "true";
const thirtyOffCheckEnabled = process.env.THIRTY_CHECK_ENABLED === "true";
const thirtyOffGenNotifications =
	process.env.THIRTY_GEN_NOTIFICATIONS === "true";
const thirtyOffCheckNotifications =
	process.env.THIRTY_CHECK_NOTIFICATIONS === "true";
const twentyOffGenEnabled = process.env.TWENTY_GEN_ENABLED === "true";
const twentyOffCheckEnabled = process.env.TWENTY_CHECK_ENABLED === "true";
const twentyOffGenNotifications =
	process.env.TWENTY_GEN_NOTIFICATIONS === "true";
const twentyOffCheckNotifications =
	process.env.TWENTY_CHECK_NOTIFICATIONS === "true";
const dbMode = process.env.DB_MODE === "true";
const dbUrl = process.env.DB_URL;
const dbApiKey = process.env.DB_API_KEY;

const supabase = dbMode ? createClient(dbUrl, dbApiKey) : null;

const qtys = [
	{
		percent: 70,
		gen_enabled: seventyOffGenEnabled,
		check_enabled: seventyOffCheckEnabled,
		gen_notifications: seventyOffGenNotifications,
		check_notifications: seventyOffCheckNotifications,
	},
	{
		percent: 50,
		gen_enabled: fiftyOffGenEnabled,
		check_enabled: fiftyOffCheckEnabled,
		gen_notifications: fiftyOffGenNotifications,
		check_notifications: fiftyOffCheckNotifications,
	},
	{
		percent: 30,
		gen_enabled: thirtyOffGenEnabled,
		check_enabled: thirtyOffCheckEnabled,
		gen_notifications: thirtyOffGenNotifications,
		check_notifications: thirtyOffCheckNotifications,
	},
	{
		percent: 20,
		gen_enabled: twentyOffGenEnabled,
		check_enabled: twentyOffCheckEnabled,
		gen_notifications: twentyOffGenNotifications,
		check_notifications: twentyOffCheckNotifications,
	},
];

const logColors = {
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	white: "\x1b[37m",
};
const qtyColors = {
	70: logColors.magenta,
	50: logColors.cyan,
	30: logColors.yellow,
	20: logColors.green,
};

const app = express();

let transporter = nodemailer.createTransport({
	host: emailHost,
	port: emailPort,
	auth: {
		user: emailUser,
		pass: emailPassword,
	},
});
const sendEmail = async ({ code, qty, type, validCodes, invalidCodes }) => {
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
			from: `Códigos McDonald's <${senderAddress}>`,
			to: receiverAddress,
			subject: variables[type].subject,
			text: variables[type].text,
			html: variables[type].html,
		});
	} catch (error) {
		console.log(logColors.red + error + logColors.red);
	}
};

const sendExpiredOrderEmail = async ({ email, order_id }) => {
	try {
		await transporter.sendMail({
			from: `Dantutu Store <${senderAddress}>`,
			to: email,
			subject: `¡Tu orden en Dantutu Store ha expirado! - Orden ${order_id}`, // Subject line
			text: `Tu orden en Dantutu Store ha expirado`,
			html: `
                <h3>Tu orden ${order_id} en Dantutu Store ha expirado.</h3>
            </br>
            <p>Si deseas realizar una nueva compra, por favor, visita nuestra tienda. En caso de que hayas realizado el pago y no hayas subido el comprobante, por favor, escribime a @dantutu_ en Twitter.</p>
            </p>
            </br>
            <p>Email enviado automaticamente, no responder.</p>
            `,
		});
	} catch (error) {
		console.log(logColors.red + error + logColors.red);
	}
};

const generateCode = ({ char, qty }) => {
	// format: QTYOFFAXXXXX (QTY is two digit (20-30-40-50-60-70), X is a random character from A-Z or number from 0-9)
	const code =
		"OFF" +
		qty.toString() +
		char +
		Math.random().toString(36).substring(2, 7).toUpperCase();
	return code;
};

const generateAndCheckCodeA = async (qty) => {
	const code = generateCode({ char: "A", qty });

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
				// check if duplicate
				const data = dbMode
					? null
					: await fs.promises.readFile(qty + "off.txt", "utf8");
				const codes = dbMode
					? null
					: data.split(/\r?\n/).filter((code) => code.trim());
				if (codes && codes.includes(code)) {
					console.log(
						`${logColors.red} Duplicate ${qty}% off code: ${code} ${logColors.red}`
					);
					return;
				}
				!dbMode && fs.appendFileSync(qty + "off.txt", code + "\n");

				if (qty === 70) {
					console.log(
						`${qtyColors[qty]} VALID ${qty}% OFF CODE: ${code}!!! ${qtyColors[qty]}`
					);
				} else {
					console.log(
						`${qtyColors[qty]} Valid ${qty}% off code: ${code} ${qtyColors[qty]}`
					);
				}

				if (dbMode) {
					const { error } = await supabase
						// .from("codes")
						.from("codes_sv")
						.insert([{ code: code, qty: qty }]);

					if (error) {
						console.log(
							`${logColors.red} Error inserting code ${code} into database: ${error.message} ${logColors.red}`
						);
					} else {
						console.log(
							`${logColors.green} Code ${code} inserted into database ${logColors.green}`
						);
					}
				}

				emailsEnabled &&
					qtys.find((q) => q.percent === qty).gen_notifications &&
					(await sendEmail({
						code: code,
						qty: qty,
						type: "codeFound",
						validCodes: [],
						invalidCodes: [],
					}));
			}
		} catch (error) {
			console.log(
				`${logColors.yellow} Error checking ${qty}% off code: ${code} - ${error.code} ${logColors.yellow}`
			);
		}
	} catch (error) {
		console.log(logColors.red + error + logColors.red);
	}
};

const generateAndCheckCodeB = async (qty) => {
	const code = generateCode({ char: "B", qty });

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
				// check if duplicate
				const data = dbMode
					? null
					: await fs.promises.readFile(qty + "off.txt", "utf8");
				const codes = dbMode
					? null
					: data.split(/\r?\n/).filter((code) => code.trim());
				if (codes && codes.includes(code)) {
					console.log(
						`${logColors.red} Duplicate ${qty}% off code: ${code} ${logColors.red}`
					);
					return;
				}
				!dbMode && fs.appendFileSync(qty + "off.txt", code + "\n");

				if (qty === 70) {
					console.log(
						`${qtyColors[qty]} VALID ${qty}% OFF CODE: ${code}!!! ${qtyColors[qty]}`
					);
				} else {
					console.log(
						`${qtyColors[qty]} Valid ${qty}% off code: ${code} ${qtyColors[qty]}`
					);
				}

				if (dbMode) {
					const { error } = await supabase
						// .from("codes")
						.from("codes_sv")
						.insert([{ code: code, qty: qty }]);

					if (error) {
						console.log(
							`${logColors.red} Error inserting code ${code} into database: ${error.message} ${logColors.red}`
						);
					} else {
						console.log(
							`${logColors.green} Code ${code} inserted into database ${logColors.green}`
						);
					}
				}

				emailsEnabled &&
					qtys.find((q) => q.percent === qty).gen_notifications &&
					(await sendEmail({
						code: code,
						qty: qty,
						type: "codeFound",
						validCodes: [],
						invalidCodes: [],
					}));
			}
		} catch (error) {
			console.log(
				`${logColors.yellow} Error checking ${qty}% off code: ${code} - ${error.code} ${logColors.yellow}`
			);
		}
	} catch (error) {
		console.log(logColors.red + error + logColors.red);
	}
};

const generateAndCheckCodeF = async (qty) => {
	const code = generateCode({ char: "F", qty });

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
				// check if duplicate
				const data = dbMode
					? null
					: await fs.promises.readFile(qty + "off.txt", "utf8");
				const codes = dbMode
					? null
					: data.split(/\r?\n/).filter((code) => code.trim());
				if (codes && codes.includes(code)) {
					console.log(
						`${logColors.red} Duplicate ${qty}% off code: ${code} ${logColors.red}`
					);
					return;
				}
				!dbMode && fs.appendFileSync(qty + "off.txt", code + "\n");

				if (qty === 70) {
					console.log(
						`${qtyColors[qty]} VALID ${qty}% OFF CODE: ${code}!!! ${qtyColors[qty]}`
					);
				} else {
					console.log(
						`${qtyColors[qty]} Valid ${qty}% off code: ${code} ${qtyColors[qty]}`
					);
				}

				if (dbMode) {
					const { error } = await supabase
						// .from("codes")
						.from("codes_sv")
						.insert([{ code: code, qty: qty }]);

					if (error) {
						console.log(
							`${logColors.red} Error inserting code ${code} into database: ${error.message} ${logColors.red}`
						);
					} else {
						console.log(
							`${logColors.green} Code ${code} inserted into database ${logColors.green}`
						);
					}
				}

				emailsEnabled &&
					qtys.find((q) => q.percent === qty).gen_notifications &&
					(await sendEmail({
						code: code,
						qty: qty,
						type: "codeFound",
						validCodes: [],
						invalidCodes: [],
					}));
			}
		} catch (error) {
			console.log(
				`${logColors.yellow} Error checking ${qty}% off code: ${code} - ${error.code} ${logColors.yellow}`
			);
		}
	} catch (error) {
		console.log(logColors.red + error + logColors.red);
	}
};

const generateAndCheckCodeG = async (qty) => {
	const code = generateCode({ char: "G", qty });

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
				// check if duplicate
				const data = dbMode
					? null
					: await fs.promises.readFile(qty + "off.txt", "utf8");
				const codes = dbMode
					? null
					: data.split(/\r?\n/).filter((code) => code.trim());
				if (codes && codes.includes(code)) {
					console.log(
						`${logColors.red} Duplicate ${qty}% off code: ${code} ${logColors.red}`
					);
					return;
				}
				!dbMode && fs.appendFileSync(qty + "off.txt", code + "\n");

				if (qty === 70) {
					console.log(
						`${qtyColors[qty]} VALID ${qty}% OFF CODE: ${code}!!! ${qtyColors[qty]}`
					);
				} else {
					console.log(
						`${qtyColors[qty]} Valid ${qty}% off code: ${code} ${qtyColors[qty]}`
					);
				}

				if (dbMode) {
					const { error } = await supabase
						// .from("codes")
						.from("codes_sv")
						.insert([{ code: code, qty: qty }]);

					if (error) {
						console.log(
							`${logColors.red} Error inserting code ${code} into database: ${error.message} ${logColors.red}`
						);
					} else {
						console.log(
							`${logColors.green} Code ${code} inserted into database ${logColors.green}`
						);
					}
				}

				emailsEnabled &&
					qtys.find((q) => q.percent === qty).gen_notifications &&
					(await sendEmail({
						code: code,
						qty: qty,
						type: "codeFound",
						validCodes: [],
						invalidCodes: [],
					}));
			}
		} catch (error) {
			console.log(
				`${logColors.yellow} Error checking ${qty}% off code: ${code} - ${error.code} ${logColors.yellow}`
			);
		}
	} catch (error) {
		console.log(logColors.red + error + logColors.red);
	}
};

const generateAndCheckCodeH = async (qty) => {
	const code = generateCode({ char: "H", qty });

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
				// check if duplicate
				const data = dbMode
					? null
					: await fs.promises.readFile(qty + "off.txt", "utf8");
				const codes = dbMode
					? null
					: data.split(/\r?\n/).filter((code) => code.trim());
				if (codes && codes.includes(code)) {
					console.log(
						`${logColors.red} Duplicate ${qty}% off code: ${code} ${logColors.red}`
					);
					return;
				}
				!dbMode && fs.appendFileSync(qty + "off.txt", code + "\n");

				if (qty === 70) {
					console.log(
						`${qtyColors[qty]} VALID ${qty}% OFF CODE: ${code}!!! ${qtyColors[qty]}`
					);
				} else {
					console.log(
						`${qtyColors[qty]} Valid ${qty}% off code: ${code} ${qtyColors[qty]}`
					);
				}

				if (dbMode) {
					const { error } = await supabase
						// .from("codes")
						.from("codes_sv")
						.insert([{ code: code, qty: qty }]);

					if (error) {
						console.log(
							`${logColors.red} Error inserting code ${code} into database: ${error.message} ${logColors.red}`
						);
					} else {
						console.log(
							`${logColors.green} Code ${code} inserted into database ${logColors.green}`
						);
					}
				}

				emailsEnabled &&
					qtys.find((q) => q.percent === qty).gen_notifications &&
					(await sendEmail({
						code: code,
						qty: qty,
						type: "codeFound",
						validCodes: [],
						invalidCodes: [],
					}));
			}
		} catch (error) {
			console.log(
				`${logColors.yellow} Error checking ${qty}% off code: ${code} - ${error.code} ${logColors.yellow}`
			);
		}
	} catch (error) {
		console.log(logColors.red + error + logColors.red);
	}
};

const generateAndCheckCodeC = async (qty) => {
	const code = generateCode({ char: "I", qty });

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
				// check if duplicate
				const data = dbMode
					? null
					: await fs.promises.readFile(qty + "off.txt", "utf8");
				const codes = dbMode
					? null
					: data.split(/\r?\n/).filter((code) => code.trim());
				if (codes && codes.includes(code)) {
					console.log(
						`${logColors.red} Duplicate ${qty}% off code: ${code} ${logColors.red}`
					);
					return;
				}
				!dbMode && fs.appendFileSync(qty + "off.txt", code + "\n");

				if (qty === 70) {
					console.log(
						`${qtyColors[qty]} VALID ${qty}% OFF CODE: ${code}!!! ${qtyColors[qty]}`
					);
				} else {
					console.log(
						`${qtyColors[qty]} Valid ${qty}% off code: ${code} ${qtyColors[qty]}`
					);
				}

				if (dbMode) {
					const { error } = await supabase
						// .from("codes")
						.from("codes_sv")
						.insert([{ code: code, qty: qty }]);

					if (error) {
						console.log(
							`${logColors.red} Error inserting code ${code} into database: ${error.message} ${logColors.red}`
						);
					} else {
						console.log(
							`${logColors.green} Code ${code} inserted into database ${logColors.green}`
						);
					}
				}

				emailsEnabled &&
					qtys.find((q) => q.percent === qty).gen_notifications &&
					(await sendEmail({
						code: code,
						qty: qty,
						type: "codeFound",
						validCodes: [],
						invalidCodes: [],
					}));
			}
		} catch (error) {
			console.log(
				`${logColors.yellow} Error checking ${qty}% off code: ${code} - ${error.code} ${logColors.yellow}`
			);
		}
	} catch (error) {
		console.log(logColors.red + error + logColors.red);
	}
};

const generateAndCheckCodeE = async (qty) => {
	const code = generateCode({ char: "E", qty });

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
				// check if duplicate
				const data = dbMode
					? null
					: await fs.promises.readFile(qty + "off.txt", "utf8");
				const codes = dbMode
					? null
					: data.split(/\r?\n/).filter((code) => code.trim());
				if (codes && codes.includes(code)) {
					console.log(
						`${logColors.red} Duplicate ${qty}% off code: ${code} ${logColors.red}`
					);
					return;
				}
				!dbMode && fs.appendFileSync(qty + "off.txt", code + "\n");

				if (qty === 70) {
					console.log(
						`${qtyColors[qty]} VALID ${qty}% OFF CODE: ${code}!!! ${qtyColors[qty]}`
					);
				} else {
					console.log(
						`${qtyColors[qty]} Valid ${qty}% off code: ${code} ${qtyColors[qty]}`
					);
				}

				if (dbMode) {
					const { error } = await supabase
						// .from("codes")
						.from("codes_sv")
						.insert([{ code: code, qty: qty }]);

					if (error) {
						console.log(
							`${logColors.red} Error inserting code ${code} into database: ${error.message} ${logColors.red}`
						);
					} else {
						console.log(
							`${logColors.green} Code ${code} inserted into database ${logColors.green}`
						);
					}
				}

				emailsEnabled &&
					qtys.find((q) => q.percent === qty).gen_notifications &&
					(await sendEmail({
						code: code,
						qty: qty,
						type: "codeFound",
						validCodes: [],
						invalidCodes: [],
					}));
			}
		} catch (error) {
			console.log(
				`${logColors.yellow} Error checking ${qty}% off code: ${code} - ${error.code} ${logColors.yellow}`
			);
		}
	} catch (error) {
		console.log(logColors.red + error + logColors.red);
	}
};

const checkExistingCodes = async () => {
	let validCodes = [];
	let invalidCodes = [];
	let totalCodesChecked = 0;
	console.log(
		logColors.white +
			"\nVerificando de códigos existentes de " +
			qtys
				.filter((qty) => qty.check_enabled)
				.map((qty) => qty.percent + "%")
				.join(", ") +
			"...\n" +
			logColors.white
	);

	await Promise.all(
		qtys
			.filter((qty) => qty.check_enabled)
			.map(async ({ percent: qty }) => {
				try {
					const data = dbMode
						? null
						: await fs.promises.readFile(qty + "off.txt", "utf8");
					const codes = dbMode
						? await supabase
								// .from("codes")
								.from("codes_sv")
								.select("code")
								.eq("qty", qty)
								.eq("is_used", false)
								.then((data) => data.data.map((code) => code.code))
						: data.split(/\r?\n/).filter((code) => code.trim());
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
									if (status === 801) {
										invalidCodesForQty.push(codeValue);
										invalidCodes.push(codeValue);
										console.log(
											`${logColors.red} ${qty}% off code: ${codeValue} is not valid anymore. Status code: ${status} ${logColors.red}`
										);
									} else {
										console.log(
											`${logColors.yellow} ${qty}% off code: ${codeValue} checked as invalid but not used. Status code: ${status} ${logColors.yellow}`
										);
									}
								}
								totalCodesChecked++;
							} catch (error) {
								console.log(
									`${logColors.yellow} Error checking ${qty}% off code: ${codeValue} - ${error.code} ${logColors.yellow}`
								);
							}
						})
					);

					if (invalidCodesForQty.length > 0) {
						!dbMode &&
							(await fs.promises.writeFile(
								qty + "off.txt",
								validCodesForQty.join("\n") + "\n"
							));
						!dbMode &&
							(await fs.promises.appendFile(
								"already_used.txt",
								invalidCodesForQty
									.map((code) => `${qty}% OFF CODE: ${code}`)
									.join("\n") + "\n"
							));
						if (dbMode) {
							const { error } = await supabase
								// .from("codes")
								.from("codes_sv")
								.upsert(
									invalidCodesForQty.map((code) => ({
										code: code,
										qty: qty,
										is_used: true,
									})),
									{ onConflict: ["code"] }
								);

							if (error) {
								console.log(
									`${logColors.red} Error updating codes in database: ${error.message} ${logColors.red}`
								);
							} else {
								console.log(
									`${logColors.green} Codes updated in database ${logColors.green}`
								);
							}
						}
					}

					emailsEnabled &&
						qtys.find((q) => q.percent === qty).check_notifications &&
						invalidCodesForQty.length > 0 &&
						(await sendEmail({
							code: "",
							qty: qty,
							type: "checkedCodes",
							validCodes: validCodesForQty,
							invalidCodes: invalidCodesForQty,
						}));
				} catch (error) {
					console.log(logColors.red + error + logColors.red);
				}
			})
	);

	console.log(
		logColors.white +
			"\n=== Resumen de verificación de códigos ===" +
			logColors.white
	);
	console.log(
		`${logColors.cyan}Total de códigos verificados: ${totalCodesChecked}${logColors.cyan}`
	);
	console.log(
		`${logColors.green}Total de códigos válidos: ${validCodes.length}${logColors.green}`
	);
	console.log(
		`${logColors.red}Total de códigos inválidos: ${invalidCodes.length}${logColors.red}`
	);
	invalidCodes.length > 0 &&
		console.log(
			`${logColors.red}Lista de códigos inválidos: ${invalidCodes.join(", ")}${
				logColors.red
			}`
		);
	console.log(
		logColors.white +
			"=======================================\n" +
			logColors.white
	);
};

let checkingCodes = false;

const checkExpiredOrders = async () => {
	// check for expired orders in table orders
	const { data: orders, error } = await supabase.from("orders").select("*");

	if (error) {
		console.log(
			`${logColors.red} Error fetching orders: ${error.message} ${logColors.red}`
		);
		return;
	}

	const expiredOrders = orders.filter(
		(order) =>
			new Date(order.expires_at) - new Date() < 0 &&
			order.payment_status === "pending"
	);

	if (expiredOrders.length > 0) {
		console.log(
			`${logColors.red} Found ${expiredOrders.length} expired orders ${logColors.red}`
		);
	}

	expiredOrders.forEach(async (order) => {
		// release codes
		const { error: releaseError } = await supabase
			// .from("codes")
			.from("codes_sv")
			.update({
				is_reserved: false,
				reserved_until: null,
			})
			.in("code", order.product_keys);

		if (releaseError) {
			console.log(
				`${logColors.red} Error releasing codes for order ${order.id}: ${releaseError.message} ${logColors.red}`
			);
		} else {
			console.log(
				`${logColors.green} Codes released for order ${order.id} ${logColors.green}`
			);
		}

		const { error } = await supabase
			.from("orders")
			.update({ payment_status: "expired" })
			.eq("id", order.id);

		if (error) {
			console.log(
				`${logColors.red} Error updating order ${order.id}: ${error.message} ${logColors.red}`
			);
		} else {
			sendExpiredOrderEmail({
				email: order.email,
				order_id: order.id,
			});
			console.log(
				`${logColors.green} Order ${order.id} updated to expired ${logColors.green}`
			);
		}
	});
};

// const checkArrayOfCodes = async () => {
// 	const codes = [];

// 	const validCodes = [];
// 	const invalidCodes = [];

// 	await Promise.all(
// 		codes.map(async (code) => {
// 			try {
// 				const response = await axios.post(
// 					"https://promos-mcd-ecommerce.appmcdonalds.com/api/promotions/check-code",
// 					{ coupon: code },
// 					{
// 						headers: {
// 							accept: "application/json, text/plain, */*",
// 							"accept-language": "en-US,en;q=0.6",
// 							"content-type": "application/json",
// 							priority: "u=1, i",
// 							"sec-ch-ua":
// 								'"Brave";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
// 							"sec-ch-ua-mobile": "?0",
// 							"sec-ch-ua-platform": '"Windows"',
// 							"sec-fetch-dest": "empty",
// 							"sec-fetch-mode": "cors",
// 							"sec-fetch-site": "cross-site",
// 							"sec-gpc": "1",
// 							"x-app-country": "AR",
// 							"x-app-version": "web-2.0.0",
// 						},
// 						referrerPolicy: "same-origin",
// 					}
// 				);

// 				const data = response.data;
// 				const isValid = data.valid;
// 				const status = data.status;

// 				if (isValid) {
// 					validCodes.push(code);
// 				} else {
// 					invalidCodes.push(code);
// 				}
// 			} catch (error) {
// 				console.log(
// 					`${logColors.yellow} Error checking ${code} - ${error.code} ${logColors.yellow}`
// 				);
// 			}
// 		})
// 	);

// 	console.log(
// 		logColors.white +
// 			"\n=== Resumen de verificación de códigos ===" +
// 			logColors.white
// 	);
// 	console.log(
// 		`${logColors.cyan}Total de códigos verificados: ${codes.length}${logColors.cyan}`
// 	);
// 	console.log(
// 		`${logColors.green}Total de códigos válidos: ${validCodes.length}${logColors.green}`
// 	);
// 	console.log(
// 		`${logColors.red}Total de códigos inválidos: ${invalidCodes.length}${logColors.red}`
// 	);
// 	validCodes.length > 0 &&
// 		console.log(
// 			`${logColors.green}Lista de códigos validos: ${validCodes.join(", ")}${
// 				logColors.green
// 			}`
// 		);
// 	console.log(
// 		logColors.white +
// 			"=======================================\n" +
// 			logColors.white
// 	);

// 	// update valid codes in database set is_reserved to false
// 	const { error } = await supabase
// 		.from("codes")
// 		.update({
// 			is_reserved: false,
// 			reserved_until: null,
// 		})
// 		.in("code", validCodes);

// 	if (error) {
// 		console.log(
// 			`${logColors.red} Error updating valid codes in database: ${error.message} ${logColors.red}`
// 		);
// 	} else {
// 		console.log(
// 			`${logColors.green} Valid codes updated in database ${logColors.green}`
// 		);
// 	}
// };

// checkArrayOfCodes();

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
	qtys
		.filter((qty) => qty.gen_enabled)
		.forEach((qty) => {
			// generateAndCheckCodeA(qty.percent);
			// generateAndCheckCodeB(qty.percent);
			generateAndCheckCodeC(qty.percent);
			generateAndCheckCodeE(qty.percent);
			generateAndCheckCodeF(qty.percent);
			generateAndCheckCodeG(qty.percent);
			generateAndCheckCodeH(qty.percent);
		});
}, 50);

// check for expired orders every 1 minute
setInterval(() => {
	(async () => {
		await checkExpiredOrders();
	})();
}, 60000);

app.listen(PORT, () => {
	console.log(
		logColors.white + "Server is running on port " + PORT + logColors.white
	);
	console.log(
		logColors.blue +
			"CURRENT SETTINGS: \nGENERATING CODES FOR: " +
			qtys
				.filter((qty) => qty.gen_enabled)
				.map((qty) => qty.percent + "%")
				.join(", ") +
			"\nCHECKING CODES FOR: " +
			qtys
				.filter((qty) => qty.check_enabled)
				.map((qty) => qty.percent + "%")
				.join(", ") +
			"\nGENERATION NOTIFICATIONS: " +
			qtys
				.filter((qty) => qty.gen_notifications)
				.map((qty) => qty.percent + "%")
				.join(", ") +
			"\nCHECK NOTIFICATIONS: " +
			qtys
				.filter((qty) => qty.check_notifications)
				.map((qty) => qty.percent + "%")
				.join(", ") +
			"\nDATABASE MODE: " +
			dbMode +
			logColors.blue
	);
});
