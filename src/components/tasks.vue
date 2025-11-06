<script setup>
</script>

<template>
    <div class="tasksHeading">
        <h1 class="pageTitle">CHOOSE A TASK TO<br>EARN REWARDS</h1>
    </div>
    <div class="cardContainer">
        <RouterLink to="/crowd" class="card">
            <h1>Crowd Level Update</h1>
        </RouterLink>

        <RouterLink to="/quiz" class="card">
            <h1>Study Quiz <br>AI</h1>
        </RouterLink>
    </div>
</template>

<style scoped>
.tasksHeading h1 {
  color: #fbe8d3;
  margin: 20px 0;
  text-align: center;    
  font-weight: 700;     
}

.cardContainer {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;             
    padding: 20px;         
    margin: 20px auto;    
    max-width: 1200px; 
}

.card {
    flex: 1 1 300px;
    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
    transition: 0.3s;
    border-radius: 5px;
    background-color: #fdf9ee;
    color: #6d412a;
    padding: 200px 20px;
    text-align: center;
    min-width: 250px;
    min-height: 250px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
}

.card:hover {
    box-shadow: 0 15px 25px 0 rgba(0,0,0,0.2);
}

</style>
