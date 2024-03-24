const path = require("path");
module.exports = async (waw) => {
	const serveAppOperator = async (operator) => {
		console.log("serveAppOperator: ", operator.domain);
		waw.api({
			domain: operator.domain,
			app: path.join(process.cwd(), "client", "dist", "app"),
		});
	};

	const serveOperator = async (operator, templatePath) => {
		console.log("serveOperator: ", operator.domain);
		operator.variables = operator.variables || {};
		operator.data = operator.data || {};
		const templateJson = {
			...waw.config,
			variables: operator.variables,
			operator,
			footer: {},
			_page: {},
		};
		const _page = {};

		if (operator.json) {
			await waw.processJson(operator.json, operator, templateJson);
		}

		const configurePage = async (page) => {
			page.data = page.data || {};

			const callback = async (req, res) => {
				operator.variables[page._id] =
					operator.variables[page._id] || {};
				const json = {
					...templateJson,
					...operator.variables[page._id],
					title:
						(page.data["seo_title"] ||
							operator.data[page.page + "_name"] ||
							page.name ||
							page.page) +
						" | " +
						operator.name,
					description:
						page.data["seo_description"] ||
						operator.data[page.page + "_description"] ||
						page.data.description ||
						operator.description ||
						templateJson.description,
					image:
						"https://" +
						operator.domain +
						(page.data["seo_thumb"] ||
							operator.thumb ||
							templateJson.thumb),
				};

				if (operator.pageJson) {
					await waw.processJson(
						operator.pageJson,
						operator,
						json,
						req
					);
				}

				if (page.json) {
					await waw.processJson(page.json, operator, json, req);
				}

				res.send(
					waw.render(
						path.join(templatePath, "dist", page.page + ".html"),
						json,
						waw.translate(req)
					)
				);
			};

			for (const url of page.url) {
				_page[url] = callback;
			}
		};
		const pages = await waw.Operatorpage.find({
			operator: operator._id,
		});
		for (const page of pages) {
			if (page.page) {
				configurePage(page);
			}
		}

		waw.api({
			domain: operator.domain,
			page: _page,
		});
	};

	if (!(await waw.Operator.count({ domain: waw.config.land }))) {
		await waw.Operator.create({ domain: waw.config.land });
	}

	// manage operators
	waw.loadOperators = async (
		query = {
			domain: {
				$exists: true,
			},
		}
	) => {
		const operators = await waw.Operator.find(query).populate({
			path: "theme",
			select: "folder",
			select: "folder repoFiles",
		});

		for (const operator of operators) {
			if (operator.domain) {
				serveAppOperator(operator);
			}
			if (operator.domain && operator.theme && operator.theme.repoFiles) {
				serveOperator(
					operator,
					path.join(process.cwd(), "themes", operator.theme.id)
				);
			}
		}
	};
	waw.loadOperators();

	// manage SSL
	const setOperator = async (operator) => {
		if (operator.domain) {
			serveAppOperator(operator);
		}

		if (operator.domain && operator.theme) {
			const _operator = await waw.Operator.findOne({
				_id: operator._id,
			}).populate({
				path: "theme",
				select: "folder repoFiles",
			});

			if (operator.theme.repoFiles) {
				const _template = path.join(
					process.cwd(),
					"templates",
					_operator.theme.folder
				);

				serveOperator(_operator, _template);
			}
		}
	};
	waw.on("operator_create", setOperator);
	waw.on("operator_update", setOperator);

	const setOperatorByPage = async (operatorpage) => {
		const operator = await waw.Operator.findOne({
			_id: operatorpage.operator,
		});

		if (operator) {
			setOperator(operator);
		}
	};
	waw.on("operatorpage_create", setOperatorByPage);
	waw.on("operatorpage_update", setOperatorByPage);
	waw.on("operatorpage_delete", setOperatorByPage);
};
