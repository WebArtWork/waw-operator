const path = require("path");
module.exports = async (waw) => {
	const serveOperator = async (operator, _template) => {
		console.log("serveOperator: ", operator.domain);

		const templateJson = {
			variables: operator.variables,
			footer: {},
			_page: {},
		};

		if (waw.config.operator.json) {
			await waw.processJson(waw.config.operator.json, operator, templateJson);
		}

		const _page = {};
		let _pages = "content";
		const configurePage = (page) => {
			page.pageJson = page.pageJson || {};

			if (!(_pages + " ").includes(" " + page.page + " ")) {
				_pages += " " + page.page;
			}

			const callback = async (req, res) => {
				const json = {
					...templateJson,
					...page.pageJson,
					title:
						(operator.data && operator.data[page.page + "_name"] ||
							page.pageJson.name ||
							page.page) +
						" | " +
						operator.name,
					description:
						operator.data && operator.data[page.page + "_description"] ||
						page.pageJson.description ||
						operator.description ||
						templateJson.description,
				};

				if (waw.config.operator.pageJson) {
					await waw.processJson(waw.config.operator.json, operator, json, req);
				}

				if (page.json) {
					await waw.processJson(page.json, operator, json, req);
				}

				res.send(
					waw.render(
						path.join(_template, "dist", page.page + ".html"),
						json,
						waw.translate(req)
					)
				);
			};

			const urls = page.url.split(" ");
			for (const url of urls) {
				_page[url] = callback;
			}
		};
		for (const page of waw.config.operator.pages || []) {
			configurePage(page);
		}

		const templatePageJson = (url, pageJson) => {
			_page[url] = (req, res) => {
				res.send(
					waw.render(
						path.join(_template, "dist", "content.html"),
						{
							...templateJson,
							...pageJson,
							title: pageJson.name + " | " + operator.name,
							description:
								pageJson.description ||
								operator.description ||
								templateJson.description,
						},
						waw.translate(req)
					)
				);
			};
		};

		for (const url in templateJson._page) {
			templatePageJson(url, templateJson._page[url]);
		}

		waw.api({
			domain: operator.domain,
			template: {
				path: _template,
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
			},
		}
	) => {
		const operators = await waw.Operator.find(query).populate({
			path: "theme",
			select: "folder",
		});

		for (const operator of operators) {
			if (operator.theme) {
				serveOperator(
					operator,
					path.join(process.cwd(), "templates", operator.theme.folder)
				);
			}
		}
	};
	waw.loadOperators();

	// manage SSL
	const setOperator = async (operator) => {
		if (waw.reserved(operator.domain)) {
			return;
		}

		if (operator.theme) {
			const _operator = await waw.Operator.findOne({
				_id: operator._id,
			}).populate({
				path: "theme",
				select: "folder",
			});

			const _template = path.join(
				process.cwd(),
				"templates",
				_operator.theme.folder
			);

			serveOperator(_operator, _template);
		}
	};

	waw.on("operator_create", setOperator);
	waw.on("operator_update", setOperator);
};
