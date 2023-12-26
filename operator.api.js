module.exports = async (waw) => {
	const templateJson = waw.readJson(process.cwd() + '/template/template.json');
	const docs = await waw.Operator.find({});
	if (waw.config.land && !docs.find(d=>d.domain === waw.config.land)) {
		const operator = await waw.Operator.create({
			variables: templateJson.variables,
			domain: waw.config.land,
		});

		docs.push(operator);
	}
	for (const doc of docs) {
		const variables = waw.mergeVariables(templateJson.variables, doc.variables);
		if (variables) {
			doc.variables = variables;
			await doc.save();
		}
	}

	waw.crud("operator", {
		create: {
			ensure: waw.role('admin', (req, res, next) => {
				req.body.variables = templateJson.variables;
				next();
			})
		},
		get: [
			{
				ensure: waw.role("admin"),
				query: () => {
					return {};
				}
			},
			{
				name: "operator",
				ensure: waw.role("operator"),
				query: (req) => {
					return {
						author: req.user._id
					};
				},
			},
		],
		fetch: {
			ensure: waw.role("admin"),
			query: (req) => {
				return {
					_id: req.body._id,
				};
			},
		},
		update: [
			{
				ensure: waw.role("admin"),
				query: (req) => {
					return {
						_id: req.body._id,
					};
				}
			},
			{
				name: "operator",
				ensure: waw.role("operator"),
				query: (req) => {
					return {
						author: req.user._id
					};
				},
			},
		],
		delete: {
			ensure: waw.role("admin"),
			query: (req) => {
				return {
					_id: req.body._id,
				};
			},
		}
	});
};
