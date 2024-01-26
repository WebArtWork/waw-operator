module.exports = async function (waw) {
	const Schema = waw.mongoose.Schema({
		name: String,
		page: String,
		url: [String],
		json: [String],
		data: {},
		operator: {
			type: waw.mongoose.Schema.Types.ObjectId,
			ref: "Operator",
		},
	});

	Schema.methods.create = function (obj, user, waw) {
		this.name = obj.name;
		this.page = obj.page;
		this.url = obj.url;
		this.json = obj.json;
		this.operator = obj.operator;
		this.data = obj.data;
	};

	return (waw.Operatorpage = waw.mongoose.model("Operatorpage", Schema));
};
