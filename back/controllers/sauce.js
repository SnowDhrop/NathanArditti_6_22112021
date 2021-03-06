const fs = require('fs');
const sanitizeHtml = require('sanitize-html');

const Sauce = require('../models/Sauce');

exports.createSauce = (req, res, next) => {

    const sauceObject = JSON.parse(req.body.sauce);

//  Sanitization -- eviter doublons
    sauceObject.name = sanitizeHtml(sauceObject.name);
    sauceObject.manufacturer = sanitizeHtml(sauceObject.manufacturer);
    sauceObject.description = sanitizeHtml(sauceObject.description);
    sauceObject.mainPepper = sanitizeHtml(sauceObject.mainPepper);

    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: "0",
        dislikes: "0",
    });

    sauce.save()
    .then(() => res.status(201).json({message: 'Objet enregistré'}))
    .catch(error => res.status(400).json({ error }));
};

exports.modifySauce = (req, res, next) => {
    // Sanitization
    const sauceObject = {};
    sauceObject.name = sanitizeHtml(req.body.name);
    sauceObject.manufacturer = sanitizeHtml(req.body.manufacturer);
    sauceObject.description = sanitizeHtml(req.body.description);
    sauceObject.mainPepper = sanitizeHtml(req.body.mainPepper);

    Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
        .then(() => res.status(200).json({ message: 'Objet modifié '}))
        .catch(error => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {     
    const filename = req.sauce.imageUrl.split('/images/')[1];

    fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id})
            .then(() => res.status(200).json({message: 'Deleted'}))
            .catch(error => res.status(400).json({ error }));
        }); 
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(400).json({ error }));
};

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

exports.likeSauce = (req, res, next) => {
    if (req.body){
        Sauce.findOne({_id: req.params.id})
            .then(sauce => {
                switch (req.body.like){
                    case 1:                              
                        if (sauce.usersLiked.includes(req.body.userId)){
                            throw 'Vous avez déjà liké';
                        };
            
                        Sauce.updateOne({_id: req.params.id}, 
                            {
                                $inc: { likes: 1 },
                                $push: { usersLiked: req.body.userId}
                            })
                            .then(() => res.status(200).json({message: 'Like ajouté'}))
                            .catch(error => res.status(400).json({ error }));                                                                           
                        break;

                    case 0:
                        if (sauce.usersLiked.includes(req.body.userId)){
                            Sauce.updateOne({ _id: req.params.id}, 
                                {
                                    $inc: { likes: -1 },
                                    $pull: { usersLiked: req.body.userId }
                                })
                                .then(() => res.status(200).json({message: "Like retiré"}))
                                .catch(error => res.status(400).json({error}));
                        }else if (sauce.usersDisliked.includes(req.body.userId)){
                            Sauce.updateOne({_id: req.params.id},
                                {
                                    $inc: { dislikes: -1},
                                    $pull: { usersDisliked: req.body.userId}
                                })
                                .then(() => res.status(200).json({message: "Dislike retiré"}))
                                .catch(error => res.status(400).json({error}));
                        }                      
                        break;

                    case -1:
                        if (sauce.usersDisliked.includes(req.body.userId)){
                            throw 'Vous avez déjà disliké';
                        };

                        Sauce.updateOne({_id: req.params.id},
                            {
                                $inc: {dislikes: 1},
                                $push: {usersDisliked: req.body.userId}
                            })
                            .then(() => res.status(200).json({message: 'Dislike ajouté'}))
                            .catch(error => res.status(400).json({ error }));         
                        break;
                };
            })
            .catch(error => res.status(400).json({error}))        
    };
}