const selectCategory = document.querySelector('#categorias');
const result = document.querySelector('#resultado');
const modal = new bootstrap.Modal('#modal', {});
const favoritesDiv = document.querySelector('.favoritos');


document.addEventListener('DOMContentLoaded', startApp);
function startApp() {
    if(selectCategory){
        getCategories();
        selectCategory.addEventListener('change', selectedCategory);
    }

    if( favoritesDiv ){
        getFavorites();
    }
};

const getCategories = () => {
    const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';
    fetch(url)
        .then( resp => resp.json())
        .then( data => showCategories(data.categories))
        .catch( error => console.warn(error))
}

const showCategories = function(categories = []) {
    categories.forEach( category => {
        const { strCategory } = category;
        const optionLabel = document.createElement('option');
        optionLabel.value = strCategory;
        optionLabel.textContent = strCategory;
        selectCategory.appendChild(optionLabel);
    });
};

function selectedCategory(e) {
    const category = e.target.value;
    const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`;
    fetch(url)
        .then( resp => resp.json())
        .then( data => showRecipe(data.meals))
        .catch( error => console.warn(error))       
}

function showRecipe( recipes = [] ) {
    clearHTML(result);

    const heading = document.createElement('H2');
    heading.classList.add('text-center', 'my-5', 'text-black');
    heading.textContent = recipes.length ? 'Resultados' : 'No hay resultados';
    result.appendChild(heading);

    recipes.forEach( recipe => {
        const { idMeal, strMeal, strMealThumb } = recipe;

        const recipeContainer = document.createElement('DIV');
        recipeContainer.classList.add('col-md-4');

        const recipeCard = document.createElement('DIV');
        recipeCard.classList.add('card', 'mb-4');

        const recipeImg = document.createElement('IMG');
        recipeImg.classList.add('card-img-top');
        recipeImg.alt = `Imagen de la receta ${strMeal}`;
        recipeImg.src = strMealThumb ?? recipe.img;

        const recipeCardBody = document.createElement('DIV');
        recipeCardBody.classList.add('card-body');

        const recipeHeading = document.createElement('H3');
        recipeHeading.classList.add('card-title', 'mb-3');
        recipeHeading.textContent = strMeal ?? recipe.title;

        const recipeButton = document.createElement('BUTTON');
        recipeButton.classList.add('btn', 'btn-danger', 'w-100');
        recipeButton.textContent = 'Ver receta';

        recipeButton.onclick = () => getRecipe(idMeal  ?? recipe.id);

        // inyectar codigo en el HTML
        recipeCardBody.appendChild(recipeHeading);
        recipeCardBody.appendChild(recipeButton);

        recipeCard.appendChild(recipeImg);
        recipeCard.appendChild(recipeCardBody);

        recipeContainer.appendChild(recipeCard);

        result.appendChild(recipeContainer);
    });
};

function clearHTML(node) {
    while( node.firstChild ){
        node.removeChild(node.firstChild)
    }
}

function getRecipe(id) {
    const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
    fetch(url)
        .then( resp => resp.json())
        .then( data => showRecipeInModal(data.meals[0]))
}

function showRecipeInModal(recipe){
    modal.show();
    // console.log(recipe);

    const { idMeal, strMeal, strMealThumb, strInstructions } = recipe;

    const modalTitle = document.querySelector('.modal .modal-title');
    const modalBody = document.querySelector('.modal .modal-body');

    modalTitle.textContent = strMeal;
    modalBody.innerHTML = `
        <img class="img-fluid" src="${strMealThumb}" alt="receta ${strMeal}" />
        <h3 class="my-3">Instrucciones</h3>
        <p>${strInstructions}</p>
        <h3 class="my-3">Ingredientes y cantidades</h3>
    `;

    // extraer y agregar ingredientes y cantidades
    const listGroup = document.createElement('UL');
    listGroup.classList.add('list-group');

    for( let i = 1; i <= 20; i++){
        if(recipe[`strIngredient${i}`]){
            const ingredient = recipe[`strIngredient${i}`];
            const measure = recipe[`strMeasure${i}`];
            const ingredientLi = document.createElement('LI');
            ingredientLi.classList.add('list-group-item');
            ingredientLi.textContent = `${ingredient} - ${measure}`;
            listGroup.appendChild(ingredientLi);
        }
    }

    modalBody.appendChild(listGroup);

    // agregar botones favorito y cerrar
    const modalFooter = document.querySelector('.modal-footer');

    const btnFavorite = document.createElement('BUTTON');
    btnFavorite.classList.add('btn', 'btn-danger', 'col');
    btnFavorite.textContent = checkExistenceInLocalStorage(idMeal) ? 'Eliminar Favorito' : 'Guardar Favorito';
    btnFavorite.onclick = () => {
        const checkExistence = checkExistenceInLocalStorage(idMeal);
        if( checkExistence ){
            deleteFavorite(idMeal);
            btnFavorite.textContent = 'Guardar Favorito';
            showToast('Eliminado correctamente');
            return;
        };

        const recipe = {
            id: idMeal,
            title: strMeal,
            img: strMealThumb
        }

        addToFavorite(recipe);
        btnFavorite.textContent = 'Eliminar Favorito';
        showToast('Agregado correctamente');
    }

    const btnCloseModal = document.createElement('BUTTON');
    btnCloseModal.classList.add('btn', 'btn-secondary', 'col');
    btnCloseModal.textContent = 'Cerrar';
    btnCloseModal.onclick = () => modal.hide();

    clearHTML(modalFooter);
    modalFooter.appendChild(btnFavorite);
    modalFooter.appendChild(btnCloseModal);
}

function addToFavorite(recipe){
    // console.log(recipe);
    const favorite = JSON.parse(localStorage.getItem('favorites')) ?? [];
    localStorage.setItem('favorites', JSON.stringify([...favorite, recipe]));
}

function checkExistenceInLocalStorage(recipeId){
    const favorites = JSON.parse(localStorage.getItem('favorites')) ?? [];
    return favorites.some( favorite => favorite.id === recipeId);
}

function deleteFavorite(recipeId){
    const favorites = JSON.parse(localStorage.getItem('favorites')) ?? [];
    const newFavorites = favorites.filter( favorite => favorite.id !== recipeId );
    localStorage.setItem('favorites', JSON.stringify(newFavorites));

    // comprobar si estamos en la ventana de favoritos y redibujar al eliminar favorito
    const locationPath = window.location.pathname;
    const hasPathFavorites = locationPath.includes('favoritos');
    if( hasPathFavorites ) showRecipe(newFavorites);
}

function showToast(message){
    const toastDiv = document.querySelector('#toast');
    const toastBody = document.querySelector('.toast-body');
    const toast = new bootstrap.Toast(toastDiv);
    toastBody.textContent = message;
    toast.show();
}

function getFavorites(){
    const favorites = JSON.parse(localStorage.getItem('favorites')) ?? [];
    if( favorites.length ){
        showRecipe(favorites);
        return;
    }
    const noFavorites = document.createElement('P');
    noFavorites.classList.add('fs-4', 'text-center', 'font-bold', 'mt-5');
    noFavorites.textContent = 'No hay favoritos aún';
    favoritesDiv.appendChild(noFavorites);
}