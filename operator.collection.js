module.exports = async function (waw) {
	const Schema = waw.mongoose.Schema({
		name: String,
		description: String,
		domain: String,
		variables: {},
		url: { type: String, sparse: true, trim: true, unique: true },
		data: {},
		theme: {
			type: waw.mongoose.Schema.Types.ObjectId,
			ref: "Theme",
		},
		author: {
			type: waw.mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	});

	Schema.methods.create = function (obj, user, waw) {
		this.name = obj.name;
		this.variables = obj.variables;
		this.author = obj.author
		this.description = obj.description;
		this.data = obj.data;
		this.url = obj.url;
		this.domain = obj.domain;
		this.theme = obj.theme;
	};
	return (waw.Operator = waw.mongoose.model("Operator", Schema));
};
