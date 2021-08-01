import os
from os import urandom
from pymongo.uri_parser import parse_uri
from flask import Flask, request, jsonify
from flask_mongoengine import MongoEngine, MongoEngineSessionInterface
from flask_restful import Api
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from mini_gplus.resources import Users, Posts, Comments, NestedComments, Circles, Circle, CircleMember, \
    Followings, Following, Profile, UserResource, Reactions, Reaction
from mini_gplus.models import User


app = Flask(__name__)
app.secret_key = urandom(24)
mongodb_uri = os.environ['MONGODB_URI']
mongodb_db = parse_uri(mongodb_uri)['database']
app.config['MONGODB_SETTINGS'] = {
    'db': mongodb_db,
    'host': mongodb_uri
}
db = MongoEngine(app)
app.session_interface = MongoEngineSessionInterface(db)


##################
# Authentication #
##################
app.config['JWT_SECRET_KEY'] = os.environ['JWT_SECRET_KEY']
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False
JWTManager(app)


@app.route('/api/signIn', methods=['POST'])
def sign_in():
    """
    Signs in a user by giving out access token
    """
    if not request.is_json:
        return jsonify({"message": "missing JSON in request"}), 400
    user_id = request.json.get('id', None)
    password = request.json.get('password', None)
    if not user_id:
        return jsonify({"message": {"id": "id is required"}}), 400
    if not password:
        return jsonify({"message": {"password": "password is required"}}), 400
    user_checked = User.check(user_id, password)
    if not user_checked:
        return jsonify({"message": "invalid id or password"}), 401
    access_token = create_access_token(identity=user_id)
    return jsonify(access_token=access_token), 200


@app.route('/api/signUp', methods=['POST'])
def sign_up():
    """
    Signs up a new user
    """
    if os.environ.get('ALLOW_SIGNUP', 'true') != 'true':
        return {'msg': 'Sign up is not open at this moment'}, 403
    user_id = request.json.get('id', None)
    password = request.json.get('password', None)
    if not user_id:
        return jsonify({"message": {"id": "id is required"}}), 400
    if not password:
        return jsonify({"message": {"password": "password is required"}}), 400
    successful = User.create(user_id, password)
    if successful:
        return {'id': user_id}, 201
    else:
        return {'msg': f'ID {user_id} is already taken'}, 409


@app.route('/api/me', methods=['GET'])
@jwt_required()
def me():
    """
    Get a user's own information
    """
    user_id = get_jwt_identity()
    return {'id': user_id}, 200


########
# APIs #
########
app.config['BUNDLE_ERRORS'] = True
CORS(app, resources={r"/api/*": {"origins": "*"}})

api = Api(app)
api.add_resource(Users, '/api/users')
api.add_resource(UserResource, '/api/user/<string:user_id>')

api.add_resource(Profile, '/api/profile/<string:profile_user_id>')

api.add_resource(NestedComments, '/api/posts/<string:post_id>/comment/<string:comment_id>/comment')
api.add_resource(Comments, '/api/posts/<string:post_id>/comment')
api.add_resource(Reactions, '/api/posts/<string:post_id>/reactions')
api.add_resource(Reaction, '/api/posts/<string:post_id>/reaction/<string:reaction_id>')
api.add_resource(Posts, '/api/posts')

api.add_resource(Circles, '/api/circles')
api.add_resource(CircleMember, '/api/circle/<string:circle_name>/membership/<string:member_user_id>')
api.add_resource(Circle, '/api/circle/<string:circle_name>')

api.add_resource(Followings, '/api/followings')
api.add_resource(Following, '/api/following/<string:following_user_id>')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
