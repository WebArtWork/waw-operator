const path = require("path");
module.exports = async (waw) => {
	const serveAppOperator = async (operator) => {
		console.log("serveAppOperator: ", operator.domain);
		waw.api({
			domain: operator.domain,
			app: path.join(
				process.cwd(),
				'client',
				'dist',
				'app',
			)
		});
	}

	const serveOperator = async (operator, templatePath) => {
		console.log("serveOperator: ", operator.domain);
		const templateJson = {
			variables: operator.variables,
			footer: {},
			_page: {},
		};
		const _page = {};
		let _pages = "";

		if (operator.json) {
			await waw.processJson(operator.json, operator, templateJson);
		}

		const configurePage = async (page) => {
			page.data = page.data || {};
			if (!(_pages + " ").includes(" " + page.page + " ")) {
				_pages += (_pages ? " " : "") + page.page;
			}

			const callback = async (req, res) => {
				operator.variables[page._id] = operator.variables[page._id] || {};
				const json = {
					...templateJson,
					...operator.variables[page._id],
					title:
						((operator.data &&
							operator.data[page.page + "_name"]) ||
							page.data.name ||
							page.page) +
						" | " +
						operator.name,
					description:
						(operator.data &&
							operator.data[page.page + "_description"]) ||
						page.data.description ||
						operator.description ||
						templateJson.description,
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
			template: {
				path: templatePath,
				prefix: "/" + operator.theme.folder,
				pages: _pages,
			},
			page: _page,
		});
	};

	// manage operators
	waw.loadOperators = async (
		query = {
			domain: {
				$exists: true,
			}
		}
	) => {
		const operators = await waw.Operator.find(query).populate({
			path: "theme",
			select: "folder",
			select: "folder repoFiles",
		});

		for (const operator of operators) {
			if (operator.domain && operator.theme && operator.theme.repoFiles) {
				serveOperator(
					operator,
					path.join(process.cwd(), "themes", operator.theme.folder)
				);
			}
			if (operator.domain) {
				serveAppOperator(operator);
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
