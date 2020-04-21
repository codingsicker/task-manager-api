const sgMail = require('@sendgrid/mail');

const companyMail = 'niraj@glarepixel.com';
sgMail.setApiKey(process.env.SANDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
	sgMail
		.send({
			to: email,
			from: companyMail,
			subject: 'Welcome To Task Manager App',
			text: `Hey ${name} welcome to Task Manager App and if you have any thing please reply.`,
		})
		.catch(e => {
			console.log(e.response.body.errors[0].message);
		});
};

const sendGoodBuyEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: companyMail,
		subject: 'Goodbuy from Task Manager App.',
		text: `Hey ${name} first of all thanks to choosing us but now you want to drop your account with this app. That's fine no problem but please tell us if anything that you think we can improve in out app.`,
	});
};

module.exports = {
	sendWelcomeEmail,
	sendGoodBuyEmail,
};
